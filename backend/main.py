import uvicorn
import logging
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Import our validated settings and the service class
from config import settings, Settings
from services import GraphQAService

# --- Logging Configuration ---
# Configure logging for the main application
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Global Service Instance ---
# This will hold our single instance of the GraphQAService
# It's populated during the 'lifespan' startup event.
service_instance: GraphQAService | None = None

# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages the application's startup and shutdown events.
    On startup: Initializes the GraphQAService.
    On shutdown: (Currently does nothing, but available for cleanup)
    """
    global service_instance
    logger.info("Application startup...")
    try:
        # Pass the validated 'settings' object to the service
        service_instance = GraphQAService(config=settings)
        await service_instance.connect_and_initialize()
        logger.info("GraphQAService initialized successfully.")
    except Exception as e:
        # If the service fails to start, log a critical error.
        # The application will still start, but endpoints will fail.
        logger.critical(f"CRITICAL: Failed to initialize service during startup: {e}", exc_info=True)
        # You could also raise the exception here to prevent FastAPI from starting
        # raise e
    
    yield  # --- Application is now running ---
    
    # --- Shutdown logic ---
    logger.info("Application shutdown...")
    service_instance = None # Clear the instance


# --- FastAPI App Initialization ---
app = FastAPI(
    title="Graph Q&A API",
    description="Ask questions about data, answered by an LLM using a Neo4j graph.",
    version="1.0.0",
    lifespan=lifespan  # Use the lifespan manager
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- Pydantic Models ---
class QueryRequest(BaseModel):
    """Pydantic model for the incoming question."""
    question: str

class QueryResponse(BaseModel):
    """Pydantic model for the outgoing answer."""
    answer: str
    generated_cypher: str | None = None
    graph_data: dict | None = None
    error: str | None = None

class StatusResponse(BaseModel):
    """Pydantic model for the status endpoint."""
    neo4j_connected: bool
    neo4j_schema: str | dict
    llm_initialized: bool
    qa_chain_ready: bool
    llm_model_name: str | None = None

class FeedbackRequest(BaseModel):
    """Pydantic model for user feedback."""
    question: str
    answer: str
    rating: str  # 'positive' or 'negative'
    comment: str | None = None

# --- Dependency Injection ---
async def get_qa_service() -> GraphQAService:
    """
    Dependency injector that provides the single, initialized
    GraphQAService instance to API endpoints.
    
    Raises:
        HTTPException(503): If the service failed to initialize on startup.
    """
    # The check is now `service_instance.chain is None`, which correctly checks
    # if the chain was initialized inside the service.
    if service_instance is None or service_instance.chain is None:
        logger.error("Endpoint called but service is not available (service_instance is None or chain is not initialized).")
        raise HTTPException(
            status_code=503, 
            detail="Service Unavailable: The QA chain is not initialized. Check server logs."
        )
    return service_instance

# --- API Endpoints ---

@app.get("/", summary="Health Check")
def read_root():
    """Root endpoint to check if the API is running."""
    return {"status": "Graph Q&A API is running"}

@app.get("/status", response_model=StatusResponse, summary="Check Backend Service Status")
async def get_status(service: GraphQAService = Depends(get_qa_service)):
    """
    Endpoint to check the status of backend connections (Neo4j, LLM).
    """
    # This now relies on the `get_status` method in the service
    return service.get_status()

@app.post("/ask", response_model=QueryResponse, summary="Ask a question to the graph")
async def ask_question(
    service: GraphQAService = Depends(get_qa_service),
    request: QueryRequest = Body(...)
):
    """
    Receives a question, passes it to the GraphCypherQAChain,
    and returns the natural language answer.
    """
    if not request.question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        # Call the service's 'query' method
        result = await service.query(request.question)
        
        if result.get("error"):
            # If the service function caught an error, return it as a 500
            # (e.g., "An error occurred: ...")
            logger.error(f"Error processed by service: {result['error']}")
            raise HTTPException(status_code=500, detail=result["error"])
        
        # On success, result["error"] should be None
        return QueryResponse(
            answer=result.get("answer", "No answer provided."),
            generated_cypher=result.get("generated_cypher"),
            graph_data=result.get("graph_data"),
            error=None
        )
    except HTTPException as http_e:
        # Re-raise HTTPExceptions (like the 500 we just raised)
        raise http_e
    except Exception as e:
        # Catch any other unexpected errors in this endpoint
        logger.error(f"Unexpected error in /ask endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")

@app.post("/feedback", summary="Submit user feedback on answers")
async def submit_feedback(request: FeedbackRequest = Body(...)):
    """
    Receives user feedback on Q&A quality for tracking and improvement.
    """
    try:
        logger.info(f"Feedback received - Rating: {request.rating}, Question: {request.question[:50]}...")
        if request.comment:
            logger.info(f"Feedback comment: {request.comment}")
        
        # In a production system, you would store this in a database
        # For now, we just log it
        return {
            "status": "success",
            "message": "Thank you for your feedback!"
        }
    except Exception as e:
        logger.error(f"Error processing feedback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process feedback")

# --- Run the App ---
if __name__ == "__main__":
    """
    This allows you to run the app directly using `python main.py`
    """
    print("Starting FastAPI server on [http://127.0.0.1:8000](http://127.0.0.1:8000)")
    print("Access the API docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)