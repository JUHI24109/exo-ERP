const http = require('http');

function post(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = typeof data === 'string' ? data : JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Attempting login as EXO-001...');
    const loginRes = await post('/api/auth/login', {
      employeeId: 'EXO-001',
      password: 'admin123'
    });
    
    if (loginRes.statusCode !== 200) {
      console.error('Login failed, aborting.');
      return;
    }
    
    const { token, user } = JSON.parse(loginRes.body);
    
    console.log('2. Attempting task creation...');
    const taskData = {
      title: 'Verification Task from Script',
      description: 'Testing task creation workflow after the ID generation fix',
      priority: 'Medium',
      assignedTo: user.id,
      deadline: new Date(Date.now() + 86400000).toISOString()
    };
    
    const taskRes = await post('/api/tasks', taskData, {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Task creation status:', taskRes.statusCode);
    console.log('Task creation body:', taskRes.body);
  } catch (error) {
    console.error('Error running test:', error);
  }
}

run();
