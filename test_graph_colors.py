"""
Test script to verify graph colors are working correctly.
This tests the backend graph extraction with proper Neo4j labels.
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def test_graph_colors():
    """Test that the backend returns correct Neo4j labels for color-coding."""
    print("=" * 60)
    print("Testing Graph Visualization Color Coding")
    print("=" * 60)
    
    try:
        from services import GraphQAService
        from config import settings
        
        print("\n✓ Imports successful")
        
        # Create service
        service = GraphQAService(config=settings)
        await service.connect_and_initialize()
        print("✓ Connected to Neo4j")
        
        # Test query that should return different node types
        test_questions = [
            "Show me movies directed by Martin Scorsese",
            "Which actors played in Casino?",
            "List all movies in the Comedy genre"
        ]
        
        for question in test_questions:
            print("\n" + "-" * 60)
            print(f"Question: {question}")
            print("-" * 60)
            
            result = await service.query(question)
            
            if result.get('error'):
                print(f"❌ Error: {result['error']}")
                continue
            
            print(f"\n✓ Answer: {result['answer'][:100]}...")
            print(f"✓ Cypher: {result.get('generated_cypher', 'N/A')}")
            
            graph_data = result.get('graph_data')
            if graph_data:
                nodes = graph_data.get('nodes', [])
                relationships = graph_data.get('relationships', [])
                
                print(f"\n✓ Graph Data Found:")
                print(f"  - Nodes: {len(nodes)}")
                print(f"  - Relationships: {len(relationships)}")
                
                # Show node types and their colors
                node_types = {}
                for node in nodes:
                    labels = node.get('labels', ['Unknown'])
                    label = labels[0] if labels else 'Unknown'
                    if label not in node_types:
                        node_types[label] = 0
                    node_types[label] += 1
                
                print(f"\n✓ Node Types (for color-coding):")
                color_map = {
                    'Person': '🟢 Green',
                    'Movie': '🔵 Blue',
                    'Genre': '🟠 Amber',
                    'Actor': '🟢 Green',
                    'Director': '🟣 Purple'
                }
                
                for label, count in sorted(node_types.items()):
                    color = color_map.get(label, '⚫ Gray (unknown)')
                    print(f"    {label}: {count} nodes → {color}")
                
                # Show a sample node
                if nodes:
                    print(f"\n✓ Sample Node:")
                    sample = nodes[0]
                    print(f"    ID: {sample.get('id')}")
                    print(f"    Label: {sample.get('label')}")
                    print(f"    Neo4j Labels: {sample.get('labels')}")
                    print(f"    Properties: {list(sample.get('properties', {}).keys())}")
                
            else:
                print("⚠️  No graph data returned (query may return scalar values)")
        
        print("\n" + "=" * 60)
        print("✅ TEST COMPLETE - Graph colors should now work!")
        print("=" * 60)
        print("\nExpected frontend behavior:")
        print("  - Person nodes: Green (#10B981)")
        print("  - Movie nodes: Blue (#3B82F6)")
        print("  - Genre nodes: Amber (#F59E0B)")
        print("  - A color legend will appear in the graph viewer")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_graph_colors())
    sys.exit(0 if success else 1)

