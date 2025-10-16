// websocket-test.js
// Run with: node websocket-test.js

const io = require('socket.io-client');

// ========================================
// CONFIGURATION - UPDATE THESE VALUES
// ========================================
const SERVER_URL = 'https://hexavia.onrender.com'; 
const TEST_USER_1_ID = '68dd5a5d7f5cb9460b3717cc'; 
const TEST_USER_2_ID = '68dd5b1203f02b905b38bcac'; 
const TEST_CHANNEL_ID = '68db30744aded2adc6ad1cef'; 

// ========================================
// TEST HELPER FUNCTIONS
// ========================================
function log(emoji, message, data = null) {
  console.log(`\n${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// TEST SUITE
// ========================================
async function runTests() {
  log('🚀', 'Starting WebSocket Tests...');
  
  // Create two socket connections (simulating two users)
  const socket1 = io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: true
  });

  const socket2 = io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: true
  });

  // ========================================
  // TEST 1: Connection Test
  // ========================================
  await new Promise((resolve) => {
    log('🔌', 'TEST 1: Testing connection...');
    
    let connected = 0;
    
    socket1.on('connect', () => {
      log('✅', `Socket 1 connected: ${socket1.id}`);
      connected++;
      if (connected === 2) resolve();
    });

    socket2.on('connect', () => {
      log('✅', `Socket 2 connected: ${socket2.id}`);
      connected++;
      if (connected === 2) resolve();
    });

    socket1.on('connect_error', (error) => {
      log('❌', 'Socket 1 connection error:', error.message);
    });

    socket2.on('connect_error', (error) => {
      log('❌', 'Socket 2 connection error:', error.message);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (connected < 2) {
        log('❌', 'Connection timeout - Make sure your server is running!');
        process.exit(1);
      }
    }, 5000);
  });

  await sleep(1000);

  // ========================================
  // TEST 2: Join Chat Test
  // ========================================
  log('👤', 'TEST 2: Testing joinChat event...');
  
  socket1.emit('joinChat', TEST_USER_1_ID);
  socket2.emit('joinChat', TEST_USER_2_ID);
  
  log('✅', 'Join chat events emitted');
  await sleep(1000);

  // ========================================
  // TEST 3: Direct Message Test
  // ========================================
  log('💬', 'TEST 3: Testing direct messages...');
  
  // Set up listener for User 2
  socket2.once('receiveDirectMessage', (data) => {
    log('✅', 'User 2 received direct message:', data);
  });

  // Set up listener for User 1 (sender also receives)
  socket1.once('receiveDirectMessage', (data) => {
    log('✅', 'User 1 (sender) received confirmation:', data);
  });

  // User 1 sends message to User 2
  socket1.emit('sendDirectMessage', {
    senderId: TEST_USER_1_ID,
    receiverId: TEST_USER_2_ID,
    message: 'Hello from User 1! This is a test message.'
  });

  await sleep(2000);

  // User 2 replies
  socket2.emit('sendDirectMessage', {
    senderId: TEST_USER_2_ID,
    receiverId: TEST_USER_1_ID,
    message: 'Hi User 1! I received your message.'
  });

  await sleep(2000);

  // ========================================
  // TEST 4: Join Channel Test
  // ========================================
  log('🏢', 'TEST 4: Testing joinChannel event...');
  
  socket1.emit('joinChannel', {
    userId: TEST_USER_1_ID,
    channelId: TEST_CHANNEL_ID
  });

  socket2.emit('joinChannel', {
    userId: TEST_USER_2_ID,
    channelId: TEST_CHANNEL_ID
  });

  log('✅', 'Join channel events emitted');
  await sleep(1000);

  // ========================================
  // TEST 5: Channel Message Test
  // ========================================
  log('📢', 'TEST 5: Testing channel messages...');
  
  // Set up listeners
  socket1.on('receiveChannelMessage', (data) => {
    log('✅', 'User 1 received channel message:', data);
  });

  socket2.on('receiveChannelMessage', (data) => {
    log('✅', 'User 2 received channel message:', data);
  });

  // User 1 sends channel message
  socket1.emit('sendChannelMessage', {
    senderId: TEST_USER_1_ID,
    channelId: TEST_CHANNEL_ID,
    message: 'Hello everyone in the channel!'
  });

  await sleep(2000);

  // User 2 sends channel message
  socket2.emit('sendChannelMessage', {
    senderId: TEST_USER_2_ID,
    channelId: TEST_CHANNEL_ID,
    message: 'Hey! This is User 2 in the channel.'
  });

  await sleep(2000);

  // ========================================
  // TEST 6: Mark as Read Test
  // ========================================
  log('✓✓', 'TEST 6: Testing mark as read...');
  
  // Listen for read receipts
  socket1.on('messagesRead', (data) => {
    log('✅', 'User 1 received read receipt:', data);
  });

  socket2.on('messagesRead', (data) => {
    log('✅', 'User 2 received read receipt:', data);
  });

  // Note: You'll need to replace these with actual message IDs from your database
  // or from the received messages above
  const testMessageIds = ['507f1f77bcf86cd799439099']; // Replace with actual message ID

  socket2.emit('markAsRead', {
    userId: TEST_USER_2_ID,
    messageIds: testMessageIds,
    type: 'direct',
    otherUserId: TEST_USER_1_ID
  });

  await sleep(2000);

  // ========================================
  // TEST 7: Error Handling Tests
  // ========================================
  log('🚫', 'TEST 7: Testing error handling...');
  
  // Test with invalid user ID
  socket1.emit('sendDirectMessage', {
    senderId: 'invalid-id',
    receiverId: TEST_USER_2_ID,
    message: 'This should fail'
  });

  await sleep(1000);

  // Test with empty message
  socket1.emit('sendDirectMessage', {
    senderId: TEST_USER_1_ID,
    receiverId: TEST_USER_2_ID,
    message: ''
  });

  await sleep(1000);

  // ========================================
  // TEST 8: Disconnect Test
  // ========================================
  log('👋', 'TEST 8: Testing disconnection...');
  
  socket1.on('disconnect', () => {
    log('✅', 'Socket 1 disconnected');
  });

  socket2.on('disconnect', () => {
    log('✅', 'Socket 2 disconnected');
  });

  await sleep(1000);

  log('🏁', 'All tests completed! Disconnecting...');
  
  socket1.close();
  socket2.close();

  await sleep(1000);
  
  log('✅', '=== TEST SUITE COMPLETED ===');
  log('📝', 'Check your server console for detailed logs');
  process.exit(0);
}

// ========================================
// RUN TESTS
// ========================================
runTests().catch(error => {
  log('❌', 'Test suite failed:', error.message);
  console.error(error);
  process.exit(1);
});


