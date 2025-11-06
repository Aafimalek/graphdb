import logging
from langchain_neo4j import Neo4jGraph
from langchain_groq import ChatGroq
from langchain_neo4j import GraphCypherQAChain
from langchain_core.prompts import PromptTemplate

# Import our validated settings
from config import Settings # Correctly import the Settings class

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- 1. CYPHER GENERATION PROMPT (FIXED) ---
# This part is stable and correct.
CYPHER_GENERATION_TEMPLATE = """
You are an expert Neo4j Cypher query translator.
Your ONLY task is to translate a user's "Question" into a valid Cypher query.
You MUST use only the provided schema. Do not use any nodes, relationships, or properties not in the schema.

Schema:
{schema}

Instructions:
1.  Your response MUST be ONLY the Cypher query.
2.  Do not add any text before or after the query (e.g., "Here is the query:").
3.  Do not add explanations or comments.
4.  Do not use backticks (```).
5.  Do not end the query with a semicolon (;) or a period (.).
6.  Always use single quotes (') for string values in queries (e.g., `name: 'Tom Hanks'`).
7.  If the question asks for a count, use `count()`.
8.  If the question asks for a list, use `RETURN a.name` or `RETURN m.title`.

Here are some examples of correct translations:

Question: How many movies did Tom Hanks act in?
Cypher: MATCH (p:Person {{name: 'Tom Hanks'}})-[:ACTED_IN]->(m:Movie) RETURN count(m)

Question: Which actors played in the movie 'Casino'?
Cypher: MATCH (m:Movie {{title: 'Casino'}})<-[:ACTED_IN]-(a:Person) RETURN a.name

Question: List all movies from the 'Comedy' genre.
Cypher: MATCH (m:Movie)-[:IN_GENRE]->(g:Genre {{name: 'Comedy'}}) RETURN m.title

Question: Find people who both directed and acted in the same movie.
Cypher: MATCH (p:Person)-[:DIRECTED]->(m:Movie), (p)-[:ACTED_IN]->(m) RETURN p.name, m.title

Question: Which actors have acted in movies directed by Robert Zemeckis?
Cypher: MATCH (p:Person {{name: 'Robert Zemeckis'}})-[:DIRECTED]->(m:Movie)<-[:ACTED_IN]-(a:Person) RETURN a.name

Question: What movies released after 1995 did Tom Hanks act in?
Cypher: MATCH (p:Person {{name: 'Tom Hanks'}})-[:ACTED_IN]->(m:Movie) WHERE m.released > 1995 RETURN m.title

Question: Which director has directed the most movies?
Cypher: MATCH (p:Person)-[:DIRECTED]->(m:Movie) RETURN p.name, count(m) AS movieCount ORDER BY movieCount DESC LIMIT 1

---
HERE IS YOUR TASK:

Question: {query}
Cypher:
"""

cypher_prompt = PromptTemplate.from_template(CYPHER_GENERATION_TEMPLATE)


# --- 2. QA GENERATION PROMPT (FINAL ANSWER) ---
#
# --- THIS IS THE FIX ---
# The example `Information` strings (e.g., `[{'p.name': ...}]`)
# must be wrapped in *double* curly braces (`{{ ... }}`)
# to tell LangChain to treat them as literal text, not template variables.
#
QA_GENERATION_TEMPLATE = """
You are a helpful question-answering assistant.
Your task is to answer the user's "Question" based ONLY on the "Information" provided.
You must follow these rules:

1.  Read the "Information" (which is the result from a database).
2.  Form a natural, human-readable answer to the "Question".
3.  Do not use any of your own internal knowledge.
4.  If the "Information" is an empty list `[]`, you MUST say:
    "I'm sorry, I couldn't find any information about that in the database."
5.  **If the "Information" is NOT empty, you MUST use it to answer the question. Do not ignore it.**
6.  **When the "Information" is a list of items, you MUST include all items from the list in your answer. Do not summarize or truncate the list.**

---
EXAMPLE 1 (Single item):
Information: `[{{'p.name': 'Martin Scorsese'}}]`
Question: Who directed the movie Casino?
Helpful Answer: The movie Casino was directed by Martin Scorsese.

---
EXAMPLE 2 (List of items):
Information: `[{{'m.title': 'Toy Story'}}, {{'m.title': 'Grumpier Old Men'}}, {{'m.title': 'Waiting to Exhale'}}]`
Question: List all the movies from 'Comedy' genre
Helpful Answer: I found the following comedy movies:
- Toy Story
- Grumpier Old Men
- Waiting to Exhale

---
EXAMPLE 3 (Empty result):
Information: `[]`
Question: Who directed the movie 'A Movie That Doesn't Exist'?
Helpful Answer: I'm sorry, I couldn't find any information about that in the database.

---
EXAMPLE 4 (Count):
Information: `[{{'count(m)': 32}}]`
Question: How many movies did Tom Hanks act in?
Helpful Answer: Tom Hanks acted in 32 movies.

---
HERE IS YOUR TASK:

Information:
{context}

Question: {question}
Helpful Answer:
"""

qa_prompt = PromptTemplate(
    input_variables=["context", "question"], template=QA_GENERATION_TEMPLATE
)


# --- 3. SERVICE CLASS (Refactored for Async and Correctness) ---

class GraphQAService:
    """
    A service class that encapsulates the Neo4j graph, LLM, and QA chain.
    This is now async and matches the expectations of main.py.
    """
    def __init__(self, config: Settings):
        """
        Initialize the service. Connections are deferred to connect_and_initialize.
        """
        logger.info("Initializing GraphQAService (deferred)...")
        self.config = config  # Store config to use in methods
        self.llm = None
        self.graph = None
        self.chain = None
        self.schema_cache = None # Store schema cache here

    async def connect_and_initialize(self):
        """
        Connect to dependencies and initialize the chain.
        This is called by the FastAPI lifespan manager in main.py.
        """
        logger.info("Connecting to services and initializing chain...")
        try:
            self.llm = ChatGroq(
                groq_api_key=self.config.GROQ_API_KEY, 
                model_name=self.config.GROQ_MODEL
            )
            logger.info(f"Successfully initialized Groq LLM: {self.config.GROQ_MODEL}")
        except Exception as e:
            logger.error(f"Failed to initialize Groq LLM: {e}", exc_info=True)
            raise  # Fatal error, stop startup

        try:
            self.graph = Neo4jGraph(
                url=self.config.NEO4J_URI,
                username=self.config.NEO4J_USERNAME,
                password=self.config.NEO4J_PASSWORD,
                database=self.config.NEO4J_DATABASE
            )
            self.graph.refresh_schema()
            self.schema_cache = self.graph.schema
            logger.info(f"Successfully connected to Neo4j and cached schema.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}", exc_info=True)
            raise  # Fatal error, stop startup

        try:
            if self.graph and self.llm:
                self.chain = GraphCypherQAChain.from_llm(
                    graph=self.graph,
                    llm=self.llm,
                    cypher_prompt=cypher_prompt, # Use our new, simpler prompt
                    qa_prompt=qa_prompt,         # Use our fixed, escaped prompt
                    validate_cypher=True,
                    verbose=True,
                    return_intermediate_steps=True,
                    top_k=100,
                    allow_dangerous_requests=True
                )
                logger.info("GraphCypherQAChain initialized successfully (dangerous requests allowed).")
            else:
                logger.warning("QA Chain not initialized due to missing Graph or LLM.")
        except Exception as e:
            logger.error(f"Failed to initialize GraphCypherQAChain: {e}", exc_info=True)
            raise  # Fatal error, stop startup

    async def query(self, question: str) -> dict:
        """
        Run the QA chain asynchronously with a given question.
        (Renamed from get_answer and made async).
        """
        if not self.chain:
            logger.error("query called, but QA Chain is not initialized.")
            return {"error": "QA Chain is not initialized. Check server logs."}
        
        try:
            logger.info(f"Invoking chain (async) with question: {question}")
            result = await self.chain.ainvoke({"query": question})

            generated_cypher = "No query generated."
            graph_data = None
            
            if result.get("intermediate_steps"):
                try:
                    logger.info(f"🔍 Intermediate steps found: {len(result['intermediate_steps'])} steps")
                    
                    # Debug: Print the actual structure
                    for i, step in enumerate(result['intermediate_steps']):
                        logger.info(f"  Step {i}: keys = {list(step.keys() if isinstance(step, dict) else 'not a dict')}")
                        logger.debug(f"  Step {i} content: {step}")
                    
                    generated_cypher = result["intermediate_steps"][0]["query"]
                    logger.info(f"📝 Generated Cypher: {generated_cypher}")
                    
                    # The context is actually in a different place - check step structure
                    # GraphCypherQAChain returns steps as: [{"query": cypher, "context": results}, ...]
                    # But sometimes the structure is different
                    
                    context = None
                    # Try different possible locations for the query results
                    if isinstance(result["intermediate_steps"][0], dict):
                        context = result["intermediate_steps"][0].get("context")
                    
                    # If not found, try the second step (sometimes results are in step[1])
                    if not context and len(result["intermediate_steps"]) > 1:
                        if isinstance(result["intermediate_steps"][1], dict):
                            context = result["intermediate_steps"][1].get("context")
                        elif isinstance(result["intermediate_steps"][1], list):
                            context = result["intermediate_steps"][1]
                    
                    logger.info(f"📊 Context available: {context is not None}")
                    logger.info(f"📊 Context type: {type(context)}")
                    
                    if context:
                        logger.info(f"🎯 Attempting graph data extraction...")
                        graph_data = self._extract_graph_data(context, generated_cypher)
                        
                        if graph_data:
                            logger.info(f"✅ Graph data extracted successfully!")
                            logger.info(f"   - Nodes: {len(graph_data.get('nodes', []))}")
                            logger.info(f"   - Relationships: {len(graph_data.get('relationships', []))}")
                        else:
                            logger.warning("⚠️ Graph extraction returned None")
                    else:
                        logger.warning("⚠️ No context in intermediate steps")
                        logger.warning(f"⚠️ Full intermediate_steps structure: {result.get('intermediate_steps')}")
                        
                except (IndexError, KeyError, TypeError) as e:
                    logger.warning(f"Could not extract data from intermediate_steps: {e}")
                    logger.debug(f"Intermediate steps: {result.get('intermediate_steps')}")
            
            return {
                "answer": result.get("result", "No answer found."), 
                "generated_cypher": generated_cypher,
                "graph_data": graph_data,
                "error": None # Explicitly return no error on success
            }
        except Exception as e:
            # Log the full traceback
            logger.error(f"Error during async chain invocation: {e}", exc_info=True)
            if "Neo.ClientError.Statement.SyntaxError" in str(e):
                return {"error": "The LLM generated an invalid Cypher query. Please try rephrasing your question."}
            # Return the error message string
            return {"error": f"An error occurred: {str(e)}"}
    
    def _serialize_property(self, value):
        """Convert Neo4j types to JSON-serializable types."""
        import neo4j.time
        
        if value is None:
            return None
        elif isinstance(value, (neo4j.time.Date, neo4j.time.DateTime)):
            return str(value)
        elif isinstance(value, dict):
            return {k: self._serialize_property(v) for k, v in value.items()}
        elif isinstance(value, (list, tuple)):
            return [self._serialize_property(item) for item in value]
        elif isinstance(value, (int, float, str, bool)):
            return value
        else:
            return str(value)
    
    def _extract_graph_data(self, context, cypher_query: str) -> dict:
        """
        Extract graph visualization data from query results.
        Returns a structure with nodes and relationships.
        """
        try:
            # Only extract graph data if the query uses MATCH (indicates graph traversal)
            if "MATCH" not in cypher_query.upper():
                logger.info("Query doesn't use MATCH, skipping graph extraction")
                return None
            
            # Execute the query again to get raw graph data
            # Modify the query to return nodes and relationships
            graph_query = self._create_graph_query(cypher_query)
            logger.info(f"Executing graph query: {graph_query}")
            
            raw_result = self.graph.query(graph_query)
            
            logger.info(f"Query returned {len(raw_result)} records")
            
            nodes = {}
            relationships = []
            
            # Extract which variables are nodes vs relationships from the MATCH pattern
            node_vars, rel_vars = self._extract_variables_from_pattern(cypher_query)
            logger.info(f"Identified node variables: {node_vars}, relationship variables: {rel_vars}")
            
            for idx, record in enumerate(raw_result):
                logger.debug(f"Processing record {idx}: {record}")
                
                # First pass: collect label information
                labels_map = {}
                for key, value in record.items():
                    if key.endswith('_labels') and isinstance(value, list):
                        # This is a labels array like 'm_labels': ['Movie']
                        original_key = key[:-7]  # Remove '_labels' suffix
                        labels_map[original_key] = value
                        logger.info(f"  Found labels for '{original_key}': {value}")
                
                # Second pass: process nodes and relationships
                for key, value in record.items():
                    # Skip label entries
                    if key.endswith('_labels'):
                        continue
                    
                    if value is None:
                        continue
                    
                    # Check the type of value
                    value_type = type(value).__name__
                    logger.info(f"  Key '{key}': type={value_type}")
                    
                    # Neo4jGraph.query() returns dicts, not Node/Relationship objects
                    # We need to determine if a dict represents a node or relationship based on the variable name
                    
                    if isinstance(value, dict):
                        # Check if this variable is a node or relationship based on the MATCH pattern
                        if key in node_vars:
                            # This is a node
                            try:
                                # Use properties to create a unique ID (use name if available, otherwise hash of properties)
                                node_id_prop = value.get('name') or value.get('id') or value.get('title') or str(hash(frozenset(value.items())))
                                node_id = f"{key}_{node_id_prop}"
                                
                                if node_id not in nodes:
                                    # Get a readable label from properties
                                    label = value.get('name') or value.get('title') or value.get('id') or key
                                    
                                    # Get the actual Neo4j labels from the labels_map
                                    neo4j_labels = labels_map.get(key, [key.capitalize()])
                                    
                                    # Serialize properties to JSON-safe types
                                    serialized_props = {k: self._serialize_property(v) for k, v in value.items()}
                                    
                                    nodes[node_id] = {
                                        'id': node_id,
                                        'label': str(label),
                                        'labels': neo4j_labels,  # Use actual Neo4j labels
                                        'properties': serialized_props
                                    }
                                    logger.info(f"Added node {node_id} with Neo4j labels {neo4j_labels}")
                            except Exception as e:
                                logger.warning(f"Error processing node dict: {e}")
                        
                        elif key in rel_vars:
                            # This is a relationship
                            try:
                                rel_type = value.get('type', 'RELATED_TO')
                                start_id = value.get('start')
                                end_id = value.get('end')
                                
                                if start_id and end_id:
                                    # Serialize relationship properties
                                    rel_props = {k: self._serialize_property(v) 
                                                for k, v in value.items() 
                                                if k not in ['type', 'start', 'end']}
                                    
                                    relationships.append({
                                        'type': rel_type,
                                        'startNode': str(start_id),
                                        'endNode': str(end_id),
                                        'properties': rel_props
                                    })
                                    logger.info(f"Added relationship: {start_id} -{rel_type}-> {end_id}")
                            except Exception as e:
                                logger.warning(f"Error processing relationship dict: {e}")
            
            # Convert nodes dict to list
            nodes_list = list(nodes.values())
            
            logger.info(f"Extracted {len(nodes_list)} nodes and {len(relationships)} relationships")
            
            if len(nodes_list) > 0 or len(relationships) > 0:
                return {
                    'nodes': nodes_list,
                    'relationships': relationships
                }
            else:
                logger.info("No nodes or relationships found in query results")
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting graph data: {e}", exc_info=True)
            return None
    
    def _create_graph_query(self, original_query: str) -> str:
        """
        Modify the query to return graph elements (nodes and relationships).
        """
        import re
        
        try:
            query_upper = original_query.upper()
            
            # Check if query has MATCH
            if "MATCH" not in query_upper:
                return original_query
            
            # Extract MATCH clause
            match_idx = query_upper.find("MATCH")
            
            # Find WHERE, RETURN, ORDER BY, or LIMIT to know where MATCH pattern ends
            end_keywords = ["WHERE", "RETURN", "ORDER BY", "LIMIT", "WITH"]
            pattern_end = len(original_query)
            
            for keyword in end_keywords:
                idx = query_upper.find(keyword, match_idx)
                if idx != -1 and idx < pattern_end:
                    pattern_end = idx
            
            # Get the MATCH pattern
            match_pattern = original_query[match_idx:pattern_end].strip()
            
            # Extract WHERE clause if exists
            where_clause = ""
            where_idx = query_upper.find("WHERE", match_idx)
            return_idx = query_upper.find("RETURN", match_idx)
            
            if where_idx != -1 and (return_idx == -1 or where_idx < return_idx):
                where_end = return_idx if return_idx != -1 else len(original_query)
                where_clause = " " + original_query[where_idx:where_end].strip()
            
            # Extract variable names from the MATCH pattern
            # Find patterns like (n:Label) or [r:TYPE] or (n) or [r]
            node_pattern = r'\((\w+)(?::[\w]+(?:\|[\w]+)*)?\)'
            rel_pattern = r'\[(\w+)(?::[\w]+)?\]'
            
            nodes = re.findall(node_pattern, match_pattern)
            rels = re.findall(rel_pattern, match_pattern)
            
            # Remove duplicates while preserving order
            nodes = list(dict.fromkeys(nodes))
            rels = list(dict.fromkeys(rels))
            
            # Build return clause with nodes and relationships
            return_items = []
            
            # Add nodes
            if nodes:
                return_items.extend(nodes)
            
            # Add relationships
            if rels:
                return_items.extend(rels)
            
            if return_items:
                # Create new query that returns the actual nodes, relationships, AND their labels
                # For each node, also return its labels using labels() function
                return_parts = []
                for item in return_items:
                    return_parts.append(item)
                    # If it's a node (not a relationship), also get its labels
                    if item in nodes:
                        return_parts.append(f"labels({item}) as {item}_labels")
                
                new_query = f"{match_pattern}{where_clause} RETURN {', '.join(return_parts)} LIMIT 50"
                logger.info(f"Modified query for graph extraction: {new_query}")
                return new_query
            
            logger.warning("Could not extract variables from MATCH pattern")
            return original_query
            
        except Exception as e:
            logger.error(f"Error creating graph query: {e}", exc_info=True)
            return original_query
    
    def _extract_variables_from_pattern(self, cypher_query: str) -> tuple:
        """
        Extract node and relationship variable names from a Cypher MATCH pattern.
        Returns (node_vars, rel_vars) as sets.
        """
        import re
        
        try:
            query_upper = cypher_query.upper()
            
            # Find MATCH clause
            match_idx = query_upper.find("MATCH")
            if match_idx == -1:
                return (set(), set())
            
            # Find where MATCH pattern ends
            end_keywords = ["WHERE", "RETURN", "ORDER BY", "LIMIT", "WITH"]
            pattern_end = len(cypher_query)
            
            for keyword in end_keywords:
                idx = query_upper.find(keyword, match_idx)
                if idx != -1 and idx < pattern_end:
                    pattern_end = idx
            
            match_pattern = cypher_query[match_idx:pattern_end]
            
            # Extract node variables: (var:Label) or (var)
            node_pattern = r'\((\w+)(?::[\w]+(?:\|[\w]+)*)?\)'
            node_vars = set(re.findall(node_pattern, match_pattern))
            
            # Extract relationship variables: [var:TYPE] or [var]
            rel_pattern = r'\[(\w+)(?::[\w]+)?\]'
            rel_vars = set(re.findall(rel_pattern, match_pattern))
            
            return (node_vars, rel_vars)
            
        except Exception as e:
            logger.error(f"Error extracting variables from pattern: {e}")
            return (set(), set())
    
    def _get_node_label(self, node) -> str:
        """Get a readable label for a node."""
        try:
            # Try common label properties
            if hasattr(node, '__getitem__'):
                for prop in ['name', 'title', 'label', 'id']:
                    if prop in node:
                        return str(node[prop])
            
            # Fallback to node type
            if hasattr(node, 'labels') and node.labels:
                return list(node.labels)[0]
            
            return "Node"
        except:
            return "Node"

    def get_status(self) -> dict:
        """
        Return the status of the service and its components.
        (This is called synchronously by main.py, so it remains `def`).
        """
        return {
            "neo4j_connected": self.graph is not None and self.schema_cache is not None,
            "neo4j_schema": self.schema_cache if self.schema_cache else "Not connected",
            "llm_initialized": self.llm is not None,
            "qa_chain_ready": self.chain is not None, # This check is now valid
            "llm_model_name": self.config.GROQ_MODEL # Use stored config
        }