# Architecture Decisions

This document captures important architectural decisions made in the project along with their context and consequences.

## PM2 vs Docker for Deployment

### Context
- The application is a Nostr relay built with NestJS
- Primary functionality is handling WebSocket connections and event persistence
- Deployment target is DigitalOcean droplets
- Need for efficient resource usage and cost-effectiveness
- High importance on WebSocket performance and connection stability

### Decision
We chose to use PM2 for process management instead of Docker containerization, opting for a simpler, more direct deployment approach.

### Rationale
1. **Resource Efficiency**
   - PM2 runs Node.js applications natively with minimal overhead
   - No virtualization layer overhead
   - More efficient memory and CPU utilization
   - Particularly important for WebSocket connections which maintain persistent connections

2. **Performance**
   - Direct access to host's network stack improves WebSocket performance
   - Lower latency for database connections
   - No container networking overhead
   - Better handling of long-lived WebSocket connections
   - More predictable performance characteristics

3. **Cost Benefits**
   - Can run effectively on smaller DigitalOcean droplets
   - Less resource overhead means more capacity for handling connections
   - Potential for significant hosting cost savings
   - Better resource utilization for the price point
   - More WebSocket connections per dollar spent

4. **Operational Simplicity**
   - Built-in process management and monitoring
   - Simple log management with `pm2 logs`
   - Easy deployment and rollback capabilities
   - Real-time monitoring with `pm2 monit`
   - Zero-downtime reloads with `pm2 reload`
   - Automatic restart on crashes
   - Built-in load balancing across CPU cores

### Trade-offs
While Docker offers benefits like environment consistency and container isolation, we found these weren't critical for our use case. The performance and resource efficiency benefits of PM2 outweighed these advantages.

#### What We Gained
- Better WebSocket performance
- Lower resource usage
- Simpler deployment process
- Built-in monitoring
- Cost savings
- Direct system access
- Easier debugging and maintenance

#### What We Gave Up
- Container isolation
- Portable container images
- Container orchestration options
- Standardized development environments

### Alternative Considerations
Docker would be more appropriate if we:
- Needed to run multiple different services
- Required strict service isolation
- Had complex development environment setup needs
- Planned for container orchestration or horizontal scaling
- Had a microservices architecture
- Needed to guarantee identical development environments across team members

### Impact
1. **Performance**
   - Smaller server footprint
   - Better performance for WebSocket connections
   - More efficient resource utilization
   - Lower latency

2. **Operations**
   - Simplified deployment process
   - Direct access to logs and metrics
   - Easy scaling across CPU cores
   - Zero-downtime updates

3. **Development**
   - Straightforward local setup
   - Direct debugging capability
   - Quick iteration cycles
   - No container build/rebuild time

### Implementation Notes
See the following guides for implementation details:
- [Deployment Guide](deployment.md) - General deployment with PM2
- [DigitalOcean Guide](deployment-digitalocean.md) - Platform-specific setup
- [Monitoring Guide](monitoring.md) - PM2 monitoring setup

### Future Considerations
While PM2 serves our current needs well, we should reassess if:
- Our architecture becomes more complex
- We need multi-region deployment
- Container orchestration becomes necessary
- Our isolation requirements change
- Team size grows significantly and environment consistency becomes a bigger concern
- Development environment setup becomes more complex
