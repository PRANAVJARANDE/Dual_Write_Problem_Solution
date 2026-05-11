1. Debug if order gets add to ltu_Outbox --- Done 
2. Nomenclature -- after scalability 


Commands

DATABASE :
To see prisma tables 
- npx prisma studio

Difference between DockerFile and dockercompose.yml
Docker Network 

Working of Kafka 
why brokers: ["kafka:29092"], 

Start Commands
PSQL 
- New user : docker-compose up -d
- Start existing : docker start postgres_outbox

Order Service : docker-compose up --build


docker ps -a
docker start container_name


docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up



-- Once all containers exist :

1. Kafka
 - docker start kafka 

2. Database
 - docker start postgres_outbox

3. Order Service 
   docker start order_service_1-backend-1
   docker start order_service_2-backend-1

4. Start the pollers 
   docker start poller_1-backend-1
   docker start poller_2-backend-2




    