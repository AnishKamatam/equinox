// Test MCP Supabase Connection for Voice Agent
import { mcpSupabaseService } from './src/services/mcpSupabaseService.js';

console.log('🧪 Testing MCP Supabase Connection...');

async function testMCPConnection() {
  try {
    // Test 1: Check MCP status
    console.log('\n1. Testing MCP Status:');
    const status = mcpSupabaseService.getMCPStatus();
    console.log('MCP Status:', status);
    
    // Test 2: Test inventory summary query
    console.log('\n2. Testing Inventory Summary Query:');
    const summaryResult = await mcpSupabaseService.processVoiceQuery('show me my inventory summary');
    console.log('Summary Result:', summaryResult);
    
    // Test 3: Test low stock query
    console.log('\n3. Testing Low Stock Query:');
    const lowStockResult = await mcpSupabaseService.processVoiceQuery('what items are running low on stock');
    console.log('Low Stock Result:', lowStockResult);
    
    // Test 4: Test best sellers query
    console.log('\n4. Testing Best Sellers Query:');
    const bestSellersResult = await mcpSupabaseService.processVoiceQuery('show me my best selling products');
    console.log('Best Sellers Result:', bestSellersResult);
    
    // Test 5: Test direct MCP query execution
    console.log('\n5. Testing Direct MCP Query:');
    const directResult = await mcpSupabaseService.executeMCPQuery('inventory_summary');
    console.log('Direct MCP Query Result:', directResult);
    
    console.log('\n✅ MCP Supabase Test Complete');
    
  } catch (error) {
    console.error('❌ MCP Test Error:', error);
  }
}

// Run the test
testMCPConnection();