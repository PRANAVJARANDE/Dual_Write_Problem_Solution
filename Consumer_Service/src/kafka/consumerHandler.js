import { consumer } from "./kafka.js";
import { getIO } from "../socket/socket.js";

const TOPICS = [
    "Orders_1___Transactional_Outbox_Pattern",
    "Orders_2___Listen_To_Yourself_Pattern",
    "Orders_3___Transactional_Log_Tailing"
];

const startConsumer = async () => {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => 
    {
      try 
      {
        const io = getIO();
        const event = JSON.parse(message.value.toString());
        let payload=event;
        if(topic=="Orders_3___Transactional_Log_Tailing")payload=event.payload.after;
        console.log(`Event Received From ${topic}`, payload);
        io.emit("consumer-event", {topic,payload,timestamp: Date.now()});
      } 
      catch (error) 
      {
        console.log("Consumer Error:", error);
      }
    }
  });
};

export { startConsumer };