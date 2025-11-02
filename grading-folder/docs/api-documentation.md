# TaskFlow API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "avatar": "https://ui-avatars.com/api/?name=John+Doe"
  }
}
```

### Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "avatar": "https://ui-avatars.com/api/?name=John+Doe"
  }
}
```

### Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "avatar": "https://ui-avatars.com/api/?name=John+Doe",
    "createdAt": "2025-10-01T10:00:00.000Z"
  }
}
```

### Update User Details
**PUT** `/auth/updatedetails`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Response:** `200 OK`

---

## Task Endpoints

### Get All Tasks
**GET** `/tasks`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): todo | in-progress | completed
- `priority` (optional): low | medium | high
- `assignedTo` (optional): User ID
- `search` (optional): Search term

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Implement authentication",
      "description": "Add JWT authentication to the API",
      "status": "in-progress",
      "priority": "high",
      "dueDate": "2025-11-15T00:00:00.000Z",
      "assignedTo": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "avatar": "https://ui-avatars.com/api/?name=Jane+Smith"
      },
      "createdBy": {
        "id": "507f1f77bcf86cd799439013",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "comments": [],
      "createdAt": "2025-10-01T10:00:00.000Z",
      "updatedAt": "2025-10-05T14:30:00.000Z"
    }
  ]
}
```

### Get Single Task
**GET** `/tasks/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Create Task
**POST** `/tasks`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT authentication to the API",
  "priority": "high",
  "status": "todo",
  "assignedTo": "507f1f77bcf86cd799439012",
  "dueDate": "2025-11-15T00:00:00.000Z"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Implement authentication",
    "description": "Add JWT authentication to the API",
    "status": "todo",
    "priority": "high",
    "dueDate": "2025-11-15T00:00:00.000Z",
    "assignedTo": { /* user object */ },
    "createdBy": { /* user object */ },
    "comments": [],
    "createdAt": "2025-10-01T10:00:00.000Z",
    "updatedAt": "2025-10-01T10:00:00.000Z"
  }
}
```

### Update Task
**PUT** `/tasks/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "completed",
  "priority": "medium"
}
```

**Response:** `200 OK`

### Delete Task
**DELETE** `/tasks/:id`

**Headers:** `Authorization: Bearer <token>`

**Role Required:** Admin

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {}
}
```

### Add Comment to Task
**POST** `/tasks/:id/comments`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "This looks good, let's deploy it!"
}
```

**Response:** `200 OK`

---

## User Endpoints

### Get All Users
**GET** `/users`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member",
      "avatar": "https://ui-avatars.com/api/?name=John+Doe",
      "isActive": true
    }
  ]
}
```

### Get Single User
**GET** `/users/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Update User
**PUT** `/users/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith"
}
```

**Response:** `200 OK`

### Deactivate User
**DELETE** `/users/:id`

**Headers:** `Authorization: Bearer <token>`

**Role Required:** Admin

**Response:** `200 OK`

---

## Notification Endpoints

### Get User Notifications
**GET** `/notifications`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `isRead` (optional): true | false

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "unreadCount": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user": "507f1f77bcf86cd799439012",
      "message": "You have been assigned a new task: Implement authentication",
      "type": "task-assigned",
      "relatedTask": {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Implement authentication",
        "status": "todo"
      },
      "isRead": false,
      "createdAt": "2025-10-05T14:30:00.000Z"
    }
  ]
}
```

### Mark Notification as Read
**PUT** `/notifications/:id/read`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Mark All Notifications as Read
**PUT** `/notifications/read-all`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Delete Notification
**DELETE** `/notifications/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role 'member' is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## WebSocket Events

### Client to Server

**authenticate**
```javascript
socket.emit('authenticate', token);
```

**task-update**
```javascript
socket.emit('task-update', { taskId, changes });
```

**typing**
```javascript
socket.emit('typing', { taskId });
```

### Server to Client

**authenticated**
```javascript
socket.on('authenticated', (data) => {
  // { success: true, userId: '...' }
});
```

**task-updated**
```javascript
socket.on('task-updated', (task) => {
  // Updated task object
});
```

**task-deleted**
```javascript
socket.on('task-deleted', (data) => {
  // { id: '...' }
});
```

**notification**
```javascript
socket.on('notification', (data) => {
  // { message: '...', task: {...} }
});
```

**comment-added**
```javascript
socket.on('comment-added', (data) => {
  // { taskId: '...', comment: {...} }
});
```

**heartbeat**
```javascript
socket.on('heartbeat', (data) => {
  // { timestamp: 1698765432000 }
});
```