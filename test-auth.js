// Simple test to verify authentication works
async function testLogin() {
    try {
        // First, create a test user
        console.log('Creating test user...');
        const registerResponse = await fetch('http://localhost:9002/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            })
        });

        if (registerResponse.status === 409) {
            console.log('Test user already exists, proceeding with login...');
        } else if (registerResponse.ok) {
            console.log('✅ Test user created successfully!');
        } else {
            const registerData = await registerResponse.json();
            console.log('❌ Failed to create test user:', registerData);
        }

        // Now try to login
        console.log('Attempting login...');
        const response = await fetch('http://localhost:9002/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (response.ok) {
            console.log('✅ Login successful!');
            console.log('Token:', data.token);

            // Test the AI workflow with this token
            const workflowResponse = await fetch('http://localhost:9002/api/ai/workflow', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${data.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'complete_workflow',
                    workflowPlatform: 'Twitter',
                    workflowContentGoal: 'Share a productivity tip',
                    workflowContentType: 'text'
                })
            });

            const workflowData = await workflowResponse.json();
            console.log('Workflow response:', workflowData);
        } else {
            console.log('❌ Login failed:', data.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testLogin();