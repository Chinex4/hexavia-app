# WebSocket API Documentation

## Overview
This document describes the WebSocket events for real-time messaging in the application. The WebSocket server handles both direct messages (user-to-user) and channel/community messages.

## Connection

### Endpoint
```javascript
const socket = io('https://hexavia.onrender.com', {
  transports: ['websocket'],
  autoConnect: true
});
```

### Connection Events
```javascript
// Listen for successful connection
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Listen for disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Listen for connection errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

## Events to Emit (Client → Server)

### 1. Join Chat (User Authentication)
Join your personal room to receive direct messages.

**Event:** `joinChat`

**Payload:**
```javascript
socket.emit('joinChat', userId);
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | The MongoDB ObjectId of the logged-in user |

**Example:**
```javascript
socket.emit('joinChat', '507f1f77bcf86cd799439011');
```

---

### 2. Send Direct Message
Send a direct message to another user.

**Event:** `sendDirectMessage`

**Payload:**
```javascript
socket.emit('sendDirectMessage', {
  senderId: 'string',
  receiverId: 'string',
  message: 'string'
});
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| senderId | String | Yes | MongoDB ObjectId of the sender (logged-in user) |
| receiverId | String | Yes | MongoDB ObjectId of the recipient user |
| message | String | Yes | The message content to send |

**Example:**
```javascript
socket.emit('sendDirectMessage', {
  senderId: '507f1f77bcf86cd799439011',
  receiverId: '507f191e810c19729de860ea',
  message: 'Hello! How are you?'
});
```

**Response Event:** `receiveDirectMessage` (see below)

---

### 3. Join Channel
Join a channel/community room to receive channel messages.

**Event:** `joinChannel`

**Payload:**
```javascript
socket.emit('joinChannel', {
  userId: 'string',
  channelId: 'string'
});
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | MongoDB ObjectId of the user joining |
| channelId | String | Yes | MongoDB ObjectId of the channel/community |

**Example:**
```javascript
socket.emit('joinChannel', {
  userId: '507f1f77bcf86cd799439011',
  channelId: '507f191e810c19729de860ea'
});
```

**Notes:**
- User must be a member of the channel to join successfully
- Join the channel room before sending or receiving channel messages

---

### 4. Send Channel Message
Send a message to a channel/community.

**Event:** `sendChannelMessage`

**Payload:**
```javascript
socket.emit('sendChannelMessage', {
  senderId: 'string',
  channelId: 'string',
  message: 'string'
});
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| senderId | String | Yes | MongoDB ObjectId of the sender |
| channelId | String | Yes | MongoDB ObjectId of the channel |
| message | String | Yes | The message content to send |

**Example:**
```javascript
socket.emit('sendChannelMessage', {
  senderId: '507f1f77bcf86cd799439011',
  channelId: '507f191e810c19729de860ea',
  message: 'Hello everyone in the channel!'
});
```

**Response Event:** `receiveChannelMessage` (see below)

**Notes:**
- Must join the channel first using `joinChannel` event
- User must be a member of the channel

---

### 5. Mark Messages as Read
Mark specific messages as read in real-time.

**Event:** `markAsRead`

**Payload:**
```javascript
socket.emit('markAsRead', {
  userId: 'string',
  messageIds: ['string'],
  type: 'direct' | 'community',
  otherUserId?: 'string',    // Required for direct messages
  channelId?: 'string'        // Required for community messages
});
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | MongoDB ObjectId of the user marking messages as read |
| messageIds | Array<String> | Yes | Array of message IDs to mark as read |
| type | String | Yes | Either 'direct' or 'community' |
| otherUserId | String | Conditional | Required if type is 'direct' |
| channelId | String | Conditional | Required if type is 'community' |

**Example (Direct Message):**
```javascript
socket.emit('markAsRead', {
  userId: '507f1f77bcf86cd799439011',
  messageIds: ['507f191e810c19729de860ea', '507f191e810c19729de860eb'],
  type: 'direct',
  otherUserId: '507f191e810c19729de860ec'
});
```

**Example (Channel Message):**
```javascript
socket.emit('markAsRead', {
  userId: '507f1f77bcf86cd799439011',
  messageIds: ['507f191e810c19729de860ea'],
  type: 'community',
  channelId: '507f191e810c19729de860ed'
});
```

**Response Event:** `messagesRead` (see below)

---

## Events to Listen (Server → Client)

### 1. Receive Direct Message
Fired when a direct message is sent or received.

**Event:** `receiveDirectMessage`

**Payload:**
```typescript
{
  _id: string;              // Message ID
  message: string;          // Message content
  sender: string;           // Sender's user ID
  username: string;         // Sender's full name
  profilePicture: string | null;  // Sender's profile picture URL
  receiverId: string;       // Receiver's user ID
  read: boolean;            // Read status (always false when first received)
  createdAt: Date;          // Message timestamp
}
```

**Example:**
```javascript
socket.on('receiveDirectMessage', (data) => {
  console.log('New direct message:', data);
  
  // Update your chat UI
  const newMessage = {
    id: data._id,
    text: data.message,
    sender: {
      id: data.sender,
      name: data.username,
      avatar: data.profilePicture
    },
    timestamp: data.createdAt,
    isRead: data.read
  };
  
  // Add to your messages state
  // addMessageToChat(newMessage);
});
```

**Notes:**
- Both sender and receiver will receive this event
- Use `sender` field to determine if it's your message or incoming

---

### 2. Receive Channel Message
Fired when a message is sent in a channel you've joined.

**Event:** `receiveChannelMessage`

**Payload:**
```typescript
{
  _id: string;              // Message ID
  message: string;          // Message content
  sender: string;           // Sender's user ID
  username: string;         // Sender's full name
  profilePicture: string | null;  // Sender's profile picture URL
  channelId: string;        // Channel ID
  read: boolean;            // Read status (always false when first received)
  createdAt: Date;          // Message timestamp
}
```

**Example:**
```javascript
socket.on('receiveChannelMessage', (data) => {
  console.log('New channel message:', data);
  
  // Update your channel chat UI
  const newMessage = {
    id: data._id,
    text: data.message,
    sender: {
      id: data.sender,
      name: data.username,
      avatar: data.profilePicture
    },
    channelId: data.channelId,
    timestamp: data.createdAt,
    isRead: data.read
  };
  
  // Add to your channel messages state
  // addMessageToChannel(data.channelId, newMessage);
});
```

**Notes:**
- All members of the channel will receive this event
- Check `sender` to determine if it's your own message

---

### 3. Messages Read
Fired when someone marks messages as read.

**Event:** `messagesRead`

**Payload:**
```typescript
{
  messageIds: string[];     // Array of message IDs that were marked as read
  readBy: string;           // User ID who marked them as read
  channelId?: string;       // Channel ID (only for community messages)
}
```

**Example (Direct Messages):**
```javascript
socket.on('messagesRead', (data) => {
  console.log('Messages marked as read:', data);
  
  // Update message read status in your UI
  data.messageIds.forEach(messageId => {
    // updateMessageReadStatus(messageId, true);
  });
});
```

**Example (Channel Messages):**
```javascript
socket.on('messagesRead', (data) => {
  if (data.channelId) {
    console.log(`Messages in channel ${data.channelId} marked as read by ${data.readBy}`);
  }
  
  // Update message read status
  // updateChannelMessageReadStatus(data.channelId, data.messageIds, data.readBy);
});
```

---

## Complete React Example

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const ChatComponent = ({ userId, currentChatId, chatType }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('https://hexavia.onrender.com', {
      transports: ['websocket']
    });

    setSocket(newSocket);

    // Join user's personal room
    newSocket.emit('joinChat', userId);

    // Listen for connection
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [userId]);

  // Handle chat type changes (direct or channel)
  useEffect(() => {
    if (!socket || !currentChatId) return;

    if (chatType === 'community') {
      // Join channel room
      socket.emit('joinChannel', {
        userId,
        channelId: currentChatId
      });
    }
  }, [socket, currentChatId, chatType, userId]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    // Direct messages
    socket.on('receiveDirectMessage', (data) => {
      setMessages(prev => [...prev, {
        id: data._id,
        text: data.message,
        senderId: data.sender,
        senderName: data.username,
        senderAvatar: data.profilePicture,
        timestamp: data.createdAt,
        isRead: data.read
      }]);
    });

    // Channel messages
    socket.on('receiveChannelMessage', (data) => {
      if (data.channelId === currentChatId) {
        setMessages(prev => [...prev, {
          id: data._id,
          text: data.message,
          senderId: data.sender,
          senderName: data.username,
          senderAvatar: data.profilePicture,
          timestamp: data.createdAt,
          isRead: data.read
        }]);
      }
    });

    // Read receipts
    socket.on('messagesRead', (data) => {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg.id)
          ? { ...msg, isRead: true }
          : msg
      ));
    });

    return () => {
      socket.off('receiveDirectMessage');
      socket.off('receiveChannelMessage');
      socket.off('messagesRead');
    };
  }, [socket, currentChatId]);

  // Send message
  const sendMessage = () => {
    if (!socket || !messageInput.trim()) return;

    if (chatType === 'direct') {
      socket.emit('sendDirectMessage', {
        senderId: userId,
        receiverId: currentChatId,
        message: messageInput
      });
    } else {
      socket.emit('sendChannelMessage', {
        senderId: userId,
        channelId: currentChatId,
        message: messageInput
      });
    }

    setMessageInput('');
  };

  // Mark messages as read
  const markAsRead = (messageIds) => {
    if (!socket) return;

    socket.emit('markAsRead', {
      userId,
      messageIds,
      type: chatType,
      ...(chatType === 'direct' 
        ? { otherUserId: currentChatId }
        : { channelId: currentChatId }
      )
    });
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={msg.senderId === userId ? 'sent' : 'received'}>
            <img src={msg.senderAvatar} alt={msg.senderName} />
            <span>{msg.senderName}</span>
            <p>{msg.text}</p>
            <small>{new Date(msg.timestamp).toLocaleString()}</small>
            {msg.isRead && <span>✓✓</span>}
          </div>
        ))}
      </div>
      
      <div className="input">
        <input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatComponent;
```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Connection refused | Server is down or wrong URL | Verify server URL and ensure server is running |
| User not found | Invalid userId | Ensure userId is valid MongoDB ObjectId |
| Not a member | User trying to access unauthorized channel | Join channel first or verify membership |
| Invalid payload | Missing required fields | Check all required fields are provided |

### Handling Connection Issues

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Show user-friendly error message
  // Implement reconnection logic
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server forcefully disconnected, reconnect manually
    socket.connect();
  }
  // else the socket will automatically try to reconnect
});
```

---

## Best Practices

1. **Always join rooms before expecting messages**
   ```javascript
   // Join user's personal room first
   socket.emit('joinChat', userId);
   
   // Then join channel if needed
   socket.emit('joinChannel', { userId, channelId });
   ```

2. **Clean up listeners to prevent memory leaks**
   ```javascript
   useEffect(() => {
     socket.on('receiveDirectMessage', handleMessage);
     
     return () => {
       socket.off('receiveDirectMessage', handleMessage);
     };
   }, []);
   ```

3. **Handle reconnection**
   ```javascript
   socket.on('connect', () => {
     // Re-join rooms after reconnection
     socket.emit('joinChat', userId);
     if (currentChannelId) {
       socket.emit('joinChannel', { userId, channelId: currentChannelId });
     }
   });
   ```

4. **Validate data before emitting**
   ```javascript
   if (!userId || !receiverId || !message.trim()) {
     console.error('Invalid message data');
     return;
   }
   socket.emit('sendDirectMessage', { senderId: userId, receiverId, message });
   ```

5. **Implement optimistic updates**
   ```javascript
   // Add message to UI immediately
   addMessageToUI(newMessage);
   
   // Then send via socket
   socket.emit('sendDirectMessage', messageData);
   
   // Update with server response if needed
   socket.on('receiveDirectMessage', (serverMessage) => {
     updateMessageInUI(serverMessage);
   });
   ```

---

## Testing

### Using Socket.io Client (for testing)

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

// Test direct message
socket.emit('joinChat', 'testUserId123');
socket.emit('sendDirectMessage', {
  senderId: 'testUserId123',
  receiverId: 'otherUserId456',
  message: 'Test message'
});

// Listen for response
socket.on('receiveDirectMessage', (data) => {
  console.log('Received:', data);
});
```

---

## Support

For issues or questions, contact the backend team or refer to:
- Socket.io Client Documentation: https://socket.io/docs/v4/client-api/
- Server logs for debugging WebSocket events

