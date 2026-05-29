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
    console.log('Login response status:', loginRes.statusCode);
    console.log('Login response body:', loginRes.body);
    
    if (loginRes.statusCode !== 200) {
      console.error('Login failed, aborting.');
      return;
    }
    
    const { token, user } = JSON.parse(loginRes.body);
    
    console.log('2. Attempting ticket creation...');
    // We send multipart/form-data manually or simulate it as JSON if the route can handle JSON?
    // Wait, the router.post('/', protect, upload.single('file'), ...) expects req.body.
    // If we send raw JSON, does multer pass it through to req.body?
    // Let's try sending as application/json and also multipart/form-data if that fails.
    const ticketData = {
      title: 'Test Ticket from Script',
      description: 'Testing ticket creation workflow',
      priority: 'Medium',
      assigneeId: user.id
    };
    
    const ticketRes = await post('/api/tickets', ticketData, {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Ticket creation status:', ticketRes.statusCode);
    console.log('Ticket creation body:', ticketRes.body);
  } catch (error) {
    console.error('Error running test:', error);
  }
}

run();
