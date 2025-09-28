import React, { useState } from 'react';
import { mcpSupabaseService } from '../services/mcpSupabaseService';

const MCPTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runMCPTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('Starting MCP Supabase test...');
      
      // Test 1: Basic connection
      const connectionTest = await mcpSupabaseService.testConnection();
      console.log('Connection test result:', connectionTest);
      
      // Test 2: Different query types
      const tests = [
        { name: 'Inventory Summary', query: 'show me my inventory summary' },
        { name: 'Low Stock Items', query: 'what items are running low' },
        { name: 'Best Sellers', query: 'show me my best selling products' },
        { name: 'Expensive Items', query: 'what are my most expensive items' }
      ];
      
      const results = {};
      for (const test of tests) {
        console.log(`Testing: ${test.name}`);
        const result = await mcpSupabaseService.processVoiceQuery(test.query);
        results[test.name] = result;
        console.log(`${test.name} result:`, result);
      }
      
      // Test 3: MCP Status
      const status = mcpSupabaseService.getMCPStatus();
      console.log('MCP Status:', status);
      
      setTestResult({
        connection: connectionTest,
        tests: results,
        status: status,
        success: true
      });
      
    } catch (error) {
      console.error('MCP Test Error:', error);
      setTestResult({
        error: error.message,
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 MCP Supabase Test</h2>
      <p>Test voice agent access to Supabase database through MCP</p>
      
      <button 
        onClick={runMCPTest} 
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          backgroundColor: isLoading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isLoading ? 'Testing MCP Connection...' : 'Run MCP Test'}
      </button>
      
      {testResult && (
        <div style={{
          background: testResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '6px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <h3>{testResult.success ? '✅ Test Results' : '❌ Test Failed'}</h3>
          
          {testResult.success ? (
            <div>
              <h4>MCP Status:</h4>
              <pre style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(testResult.status, null, 2)}
              </pre>
              
              <h4>Connection Test:</h4>
              <pre style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(testResult.connection, null, 2)}
              </pre>
              
              <h4>Voice Query Tests:</h4>
              {Object.entries(testResult.tests).map(([name, result]) => (
                <div key={name} style={{ marginBottom: '15px' }}>
                  <strong>{name}:</strong>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '10px', 
                    borderRadius: '4px',
                    marginTop: '5px',
                    fontSize: '14px'
                  }}>
                    <p><strong>Response:</strong> "{result.response}"</p>
                    <p><strong>Query Type:</strong> {result.queryType}</p>
                    <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p><strong>Error:</strong> {testResult.error}</p>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p><strong>Note:</strong> This test verifies that the voice agent can access your Supabase database through the MCP server configuration.</p>
        <p><strong>MCP Config:</strong> ~/.config/claude-code/claude_desktop_config.json</p>
        <p><strong>Project:</strong> mblgpbuvsykauaybypdf</p>
        <p><strong>Table:</strong> Inventory</p>
      </div>
    </div>
  );
};

export default MCPTest;