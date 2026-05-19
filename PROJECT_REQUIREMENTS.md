# Project Requirements: Maintenance Request System

> **Note**: If you haven't already, please start by reading the [ASSIGNMENT_DESCRIPTION.md](ASSIGNMENT_DESCRIPTION.md) to understand the full context of this assessment.

## Product Vision

Build a maintenance request tracking system where tenants can report property issues and property managers can track and resolve them.

## User Stories

### As a Tenant
- I can submit a maintenance request with a title, description, and priority level
- I can view all my maintenance requests and their current status
- I can see when my requests were created and when they were completed

### As a Property Manager
- I can view all maintenance requests across all properties
- I can assign requests to myself or other managers
- I can update the status of requests through their lifecycle (open → in-progress → completed)
- I can add priority levels to requests (low, normal, high, urgent)
- I can filter requests by status and priority to manage my workload

## Business Rules

1. **Status Workflow**: Requests must follow a valid status flow:
   - Open requests can move to "in-progress" or "cancelled"
   - In-progress requests can move to "completed" or "cancelled"  
   - Completed and cancelled are final states

2. **Access Control**:
   - Tenants can only create and view their own requests
   - Only managers/admins can change request status and assignments
   - Only managers/admins can delete requests

3. **Data Requirements**:
   - Every request must have: title, description, status, priority, property/unit identifier
   - Track who created each request and when
   - Track when requests are completed

## Deliverables

- Working backend API
- Responsive frontend UI
- Tests covering core functionality
- Brief documentation of your approach
