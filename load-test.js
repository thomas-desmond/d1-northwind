const axios = require('axios');

const endpoint = 'https://northwind-queue-worker.cf-tme.workers.dev';
const concurrency = 5;
const totalRequests = 100;

async function sendRequest() {
  const productId = Math.floor(Math.random() * 77) + 1;
  const updateInventoryBy = Math.floor(Math.random() * 10) + 1;

  try {
    const response = await axios.post(endpoint, {
      productId,
      updateInventoryBy
    });
    console.log(`Response: ${response.status}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function loadTest() {
  const promises = [];
  for (let i = 0; i < totalRequests; i++) {
    if (i % concurrency === 0) {
      await Promise.all(promises);
      promises.length = 0;
    }
    promises.push(sendRequest());
  }
  await Promise.all(promises);
}

loadTest().then(() => {
  console.log('Load test completed');
}).catch((error) => {
  console.error(`Load test failed: ${error.message}`);
});