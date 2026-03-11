# Random String Generator (RSG) Microservice

## Overview
The Random String Generator (RSG) Microservice provides cryptographically secure string generation for client applications. It supports two primary features:

1. **Random alphanumeric string generation**
2. **Pattern-based string generation**

This service is designed to be easy for teammates to integrate into their own programs using HTTP POST requests.

---

## Features

- Generate secure random alphanumeric strings
- Generate strings from custom patterns
- Validate request input
- Return JSON responses
- Handle invalid requests with clear error messages

---

## Technologies Used

- **Node.js**
- **Express**
- **crypto** module from Node.js standard library

---

## File Structure

```text
RSG/
├── server.mjs              # Express server and API routes
├── string_generator.mjs    # String generation logic
├── test.http               # Example test requests
├── package.json
└── README.md

