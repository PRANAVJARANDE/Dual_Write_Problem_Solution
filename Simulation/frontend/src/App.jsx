import React, { useState } from "react";
import { addOrder, deleteOrders, deleteOutbox, getListenOutbox, getOrders, getOutbox } from "./Services/order.service";
import { useSockets } from "../Features/useSocket";
import { useEffect } from "react";
import { orderSocket2 } from "../Features/socket";

export default function App() {
  const { orderSocket1, consumerSocket, statuses } = useSockets();
  const [formData, setFormData] = useState({
    pattern: "outbox",
    customerName: "",
    productName: "",
    quantity: 1,
    batchSize: 1,
    failureRate: 0.2
  });

  const [batchStats, setBatchStats] = useState({
    totalRequests: 0,
    dbWritesSucceeded: 0,
    kafkaPublishesSucceeded: 0,
    dbWritesFailed: 0,
    outboxQueued: 0,
    kafkaPublishesFailed: 0,
    relayPending: 0,
    consumer_consumed: 0,
    inconsistentRuns:0
  });

  const handleOrderAdded = (data) => {
    setBatchStats((prev) => ({...prev,dbWritesSucceeded: prev.dbWritesSucceeded + 1,}));
  };

  const handleOutboxOrderAdded = (data) => {
    setBatchStats((prev) => ({...prev,outboxQueued: prev.outboxQueued + 1}));
  };

  const handle_DB_write_fail = (data) => {
    setBatchStats((prev) => ({...prev,dbWritesFailed: prev.dbWritesFailed + 1}));
  };

  const handle_Consumed = ({topic}) =>{
    setBatchStats((prev) => ({...prev,consumer_consumed: prev.consumer_consumed + 1}));
    if(topic!="Orders_3___Transactional_Log_Tailing")setBatchStats((prev) => ({...prev,relayPending: prev.relayPending - 1}));
  };


  const handleResetSimulation = () => {
    setBatchStats({
      totalRequests: 0,
      dbWritesSucceeded: 0,
      kafkaPublishesSucceeded: 0,
      dbWritesFailed: 0,
      outboxQueued: 0,
      kafkaPublishesFailed: 0,
      relayPending: 0,
      consumer_consumed: 0,
      inconsistentRuns:0
    });
  };

  const [dbData, setDbData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if(orderSocket1)
    {
      orderSocket1.on("order-added", handleOrderAdded);
      orderSocket1.on("outbox-order-added", handleOutboxOrderAdded);
      orderSocket1.on("order-add-failed", handle_DB_write_fail);
    }
    if(orderSocket2)
    {
      orderSocket2.on("order-added", handleOrderAdded);
      orderSocket2.on("outbox-order-added", handleOutboxOrderAdded);
      orderSocket2.on("order-add-failed", handle_DB_write_fail);
    }
    if(consumerSocket)
    {
      consumerSocket.on("consumer-event",handle_Consumed)
    }

    return () => {
      if(orderSocket1)
      {
        orderSocket1.off("order-added", handleOrderAdded);
        orderSocket1.off("outbox-order-added", handleOutboxOrderAdded);
        orderSocket1.off("order-add-failed", handle_DB_write_fail);
      }
      if(orderSocket2)
      {
        orderSocket2.off("order-added", handleOrderAdded);
        orderSocket2.off("outbox-order-added", handleOutboxOrderAdded);
        orderSocket2.off("order-add-failed", handle_DB_write_fail);
      }
      if(consumerSocket)
      {
        consumerSocket.off("consumer-event",handle_Consumed)
      }
      
    };
  }, [orderSocket1,orderSocket2,consumerSocket,handleOrderAdded,handleOutboxOrderAdded,handle_DB_write_fail,handle_Consumed]);



  const handleGetOrders = async () => {
    setIsLoading(true);
    setActiveTab('orders');
    try {
      const data = await getOrders();
      setDbData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetOutbox = async () => {
    setIsLoading(true);
    setActiveTab('outbox');
    try {
      const data = await getOutbox();
      setDbData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetListenOutbox = async () => {
    setIsLoading(true);
    setActiveTab('listen');
    try {
      const data = await getListenOutbox();
      setDbData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const parsedValue = (id === 'quantity' || id === 'batchSize' || id === 'failureRate') 
      ? Number(value) 
      : value;

    setFormData(prevData => ({
      ...prevData,
      [id]: parsedValue
    }));
  };

  const handleSendOrders = async (e) => {
    e.preventDefault(); 
    if (!formData.customerName || !formData.productName) 
    {
      console.error("Validation failed: Missing customer or product name.");
      return;
    }
    if(addOrder(formData))
      {
        setBatchStats((prev) => ({...prev,totalRequests: prev.totalRequests + formData.batchSize}));
        if(formData.pattern!="tailing")setBatchStats((prev) => ({...prev,relayPending: prev.relayPending + formData.batchSize}));
      }
  };

  const handleDeleteOrders = async () => {
      deleteOrders();
  };

  const handleDeleteOutbox = async () => {
    deleteOutbox();
  };

  return (
    <div className="min-h-screen text-[#1f1b17] font-sans bg-gradient-to-b from-[#f8f1e8] to-[#f0e4d1] p-4 md:p-8">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#d0592c] opacity-15 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1f7a64] opacity-10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3"></div>
      </div>

      <main className="relative z-10 w-full max-w-[1240px] mx-auto pb-24">
        <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-20 items-stretch">
          <div className="self-end">
            <p className="m-0 mb-2.5 text-[0.8rem] tracking-[0.18em] uppercase text-[#d0592c]">
              Distributed Systems
            </p>
            <h1 className="m-0 text-4xl md:text-5xl lg:text-[4.7rem] font-bold leading-[0.95] max-w-[11ch] tracking-tight">
              Dual Write Problem Simulator
            </h1>
            <p className="mt-4 m-0 max-w-[62ch] text-[#6c6459] leading-[1.6]">
              Master eventual consistency by simulating the dual write problem. Compare brittle sequential operations against robust, event-driven solutions to see how modern systems maintain database and message broker alignment.
            </p>
          </div>
          
          <div className="p-6 bg-[rgba(255,250,243,0.88)] backdrop-blur-md rounded-[24px] border border-[#1f1b17]/10 shadow-[0_18px_44px_rgba(58,38,17,0.12)] grid gap-8 content-center">
             <div className="group relative overflow-hidden px-4 py-3.5 rounded-[14px] bg-[#FEFAF4] border border-[#EBE3D3] flex items-center justify-between cursor-pointer hover:bg-[#FFFBF7] hover:-translate-y-[2px] hover:shadow-[0_6px_10px_-3px_rgba(184,134,11,0.08)] transition-all duration-300">
              <div className="absolute right-3 -bottom-3 text-[3.5rem] font-black text-[#45382a]/[0.05] select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">
                01
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-[3px] h-5 bg-[#B45309] rounded-full group-hover:h-7 transition-all duration-300"></div>
                <strong className="text-[0.95rem] font-bold text-[#1E1B17] tracking-wide group-hover:text-[#3B2C21] transition-colors duration-300">
                  Transactional Outbox Pattern
                </strong>
              </div>
            </div>

            <div className="group relative overflow-hidden px-4 py-3.5 rounded-[14px] bg-[#FEFAF4] border border-[#EBE3D3] flex items-center justify-between cursor-pointer hover:bg-[#FFFBF7] hover:-translate-y-[2px] hover:shadow-[0_4px_8px_-3px_rgba(184,134,11,0.06)] transition-all duration-300">
              <div className="absolute right-3 -bottom-3 text-[3.5rem] font-black text-[#45382a]/[0.05] select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">
                02
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-[3px] h-5 bg-[#D9CAB3] rounded-full group-hover:h-6 group-hover:bg-[#B45309] transition-all duration-300"></div>
                <strong className="text-[0.95rem] font-semibold text-[#5F5449] tracking-wide group-hover:text-[#1E1B17] transition-colors duration-300">
                  Listen to Yourself Pattern
                </strong>
              </div>
            </div>

            <div className="group relative overflow-hidden px-4 py-3.5 rounded-[14px] bg-[#FEFAF4] border border-[#EBE3D3] flex items-center justify-between cursor-pointer hover:bg-[#FFFBF7] hover:-translate-y-[2px] hover:shadow-[0_4px_8px_-3px_rgba(184,134,11,0.06)] transition-all duration-300">
              <div className="absolute right-3 -bottom-3 text-[3.5rem] font-black text-[#45382a]/[0.05] select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">
                03
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-[3px] h-5 bg-[#D9CAB3] rounded-full group-hover:h-6 group-hover:bg-[#B45309] transition-all duration-300"></div>
                <strong className="text-[0.95rem] font-semibold text-[#5F5449] tracking-wide group-hover:text-[#1E1B17] transition-colors duration-300">
                  Transactional Log Tailing Pattern
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          
          <section className="p-6 md:p-8 bg-[rgba(255,250,243,0.95)] backdrop-blur-md rounded-[24px] border border-[#1f1b17]/10 shadow-[0_18px_44px_rgba(58,38,17,0.08)]">
            <div className="mb-6">
              <h2 className="m-0 text-xl md:text-2xl font-bold text-[#1E1B17] tracking-wide">
                Send orders to Order_Services to start simulation
              </h2>
            </div>
            
            <form id="bulk-form" className="grid gap-5" onSubmit={handleSendOrders}>
              
              <label className="grid gap-2 text-[0.95rem] font-medium text-[#5F5449]">
                Simulation Pattern
                <select id="pattern" value={formData.pattern} onChange={handleInputChange} required className="w-full p-3.5 rounded-[14px] border border-[#1f1b17]/15 bg-white text-[#2C261F] focus:outline-none focus:border-[#C25124] focus:ring-1 focus:ring-[#C25124] appearance-none transition-colors cursor-pointer shadow-sm">
                  <option value="outbox">1. Transactional Outbox Pattern</option>
                  <option value="listen">2. Listen to Yourself Pattern</option>
                  <option value="tailing">3. Transactional Log Tailing Pattern</option>
                </select>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="grid gap-2 text-[0.95rem] font-medium text-[#5F5449]">
                Customer Name
                  <input id="customerName" type="text" value={formData.customerName} onChange={handleInputChange} placeholder="e.g. John Doe" required className="w-full p-3.5 rounded-[14px] border border-[#1f1b17]/15 bg-white text-[#2C261F] placeholder-[#A89887] focus:outline-none focus:border-[#C25124] focus:ring-1 focus:ring-[#C25124] transition-colors shadow-sm" />
                </label>
                <label className="grid gap-2 text-[0.95rem] font-medium text-[#5F5449]">
                  Product Name
                  <input id="productName" type="text" value={formData.productName} onChange={handleInputChange} placeholder="e.g. Mechanical Keyboard" required className="w-full p-3.5 rounded-[14px] border border-[#1f1b17]/15 bg-white text-[#2C261F] placeholder-[#A89887] focus:outline-none focus:border-[#C25124] focus:ring-1 focus:ring-[#C25124] transition-colors shadow-sm" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="grid gap-2 text-[0.95rem] font-medium text-[#5F5449]">
                  Quantity
                  <input id="quantity" type="number" min="1" value={formData.quantity} onChange={handleInputChange} required className="w-full p-3.5 rounded-[14px] border border-[#1f1b17]/15 bg-white text-[#2C261F] focus:outline-none focus:border-[#C25124] focus:ring-1 focus:ring-[#C25124] transition-colors shadow-sm" />
                </label>
                <label className="grid gap-2 text-[0.95rem] font-medium text-[#5F5449]">
                  No. of similar Requests to send
                  <input id="batchSize" type="number" min="1" value={formData.batchSize} onChange={handleInputChange} required className="w-full p-3.5 rounded-[14px] border border-[#1f1b17]/15 bg-white text-[#2C261F] focus:outline-none focus:border-[#C25124] focus:ring-1 focus:ring-[#C25124] transition-colors shadow-sm" />
                </label>
              </div>

              <label className="grid gap-2 text-[0.95rem] font-medium text-[#5F5449]">
                Failure Rate [0, 1)
                <input id="failureRate" type="number" step="0.01" min="0" max="0.99" value={formData.failureRate} onChange={handleInputChange} required className="w-full p-3.5 rounded-[14px] border border-[#1f1b17]/15 bg-white text-[#2C261F] focus:outline-none focus:border-[#C25124] focus:ring-1 focus:ring-[#C25124] transition-colors shadow-sm" />
              </label>
              
              <div className="text-[#6C6459] text-[0.85rem] leading-[1.5] p-3.5 rounded-[12px] bg-white/60 border border-dashed border-[#1f1b17]/15">
                Simulate the error in the system publishing events or dbwrite. (e.g., 0.2 = 20% chance of failure).
              </div>

              <div className="flex flex-col md:flex-row flex-wrap gap-3 mt-4 pt-4 border-t border-[#1f1b17]/5">
                <button type="submit" className="flex-1 md:flex-none border-0 rounded-full px-7 py-3.5 text-white bg-gradient-to-r from-[#C25124] to-[#D96B2B] hover:from-[#B0471F] hover:to-[#C25124] cursor-pointer shadow-[0_8px_20px_rgba(194,81,36,0.2)] font-semibold transition-all duration-300 hover:-translate-y-0.5">
                  Send Orders
                </button>
                <button id="delete-orders" type="button" onClick={handleDeleteOrders} className="flex-1 md:flex-none border border-[#1f1b17]/15 rounded-full px-7 py-3.5 text-[#45382A] bg-white hover:bg-[#F9F5EC] cursor-pointer shadow-sm font-semibold transition-all duration-300">
                  Delete All Orders
                </button>
                <button id="delete-outbox" type="button" onClick={handleDeleteOutbox} className="flex-1 md:flex-none border border-red-200 rounded-full px-7 py-3.5 text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer shadow-sm font-semibold transition-all duration-300">
                  Delete all Outbox Data
                </button>
              </div>
              
            </form>
          </section>

          <section className="relative p-6 md:p-8 bg-[rgba(255,250,243,0.95)] backdrop-blur-md rounded-[24px] border border-[#1f1b17]/10 shadow-[0_18px_44px_rgba(58,38,17,0.08)]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="m-0 text-xl md:text-2xl font-bold text-[#1E1B17] tracking-wide">Latest Batch Flow</h2>
          <p className="m-0 mt-2 text-[#6c6459] text-[0.95rem] leading-[1.5]">
            These cards summarize the outcome. Numbers update as Orders get added to Database and Events get published to Message Broker.
          </p>
        </div>
        <button onClick={handleResetSimulation}
          className="shrink-0 border border-[#1f1b17]/15 rounded-full px-5 py-2.5 text-[#45382A] bg-white hover:bg-[#F9F5EC] cursor-pointer shadow-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
        >
          Reset Simulation
        </button>
      </div>

      <div id="latest-batch-flow" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      
        <div className="p-5 rounded-[18px] bg-white border border-[#1f1b17]/10 shadow-sm flex flex-col justify-between">
          <span className="text-[#6c6459] text-[0.95rem] font-medium mb-3">Total Requests</span>
          <strong className="text-4xl font-bold text-[#1E1B17]">{batchStats.totalRequests}</strong>
        </div>

        <div className="p-5 rounded-[18px] bg-[#E8EFE5] border border-[#CFDAC9] shadow-sm flex flex-col justify-between">
          <span className="text-[#45523E] text-[0.95rem] font-medium mb-3">DB Writes Succeeded</span>
          <strong className="text-4xl font-bold text-[#2A3624]">{batchStats.dbWritesSucceeded}</strong>
        </div>

        <div className="p-5 rounded-[18px] bg-[#F4EBE1] border border-[#E3D4C1] shadow-sm flex flex-col justify-between">
          <span className="text-[#635545] text-[0.95rem] font-medium mb-3">Kafka Publishes Succeeded</span>
          <strong className="text-4xl font-bold text-[#3B2E1E]">{batchStats.kafkaPublishesSucceeded}</strong>
        </div>

        <div className="p-5 rounded-[18px] bg-white border border-[#1f1b17]/10 shadow-sm flex flex-col justify-between">
          <span className="text-[#6c6459] text-[0.95rem] font-medium mb-3">DB Writes Failed</span>
          <strong className="text-4xl font-bold text-[#1E1B17]">{batchStats.dbWritesFailed}</strong>
        </div>

        <div className="p-5 rounded-[18px] bg-[#E8EFE5] border border-[#CFDAC9] shadow-sm flex flex-col justify-between">
          <span className="text-[#45523E] text-[0.95rem] font-medium mb-3">Outbox Queued</span>
          <strong className="text-4xl font-bold text-[#2A3624]">{batchStats.outboxQueued}</strong>
        </div>

        <div className="p-5 rounded-[18px] bg-[#F5E6E6] border border-[#EAC9C9] shadow-sm flex flex-col justify-between">
          <span className="text-[#6D4C4C] text-[0.95rem] font-medium mb-3">Kafka Publishes Failed</span>
          <strong className="text-4xl font-bold text-[#4A2626]">{batchStats.kafkaPublishesFailed}</strong>
        </div>

        <div className="p-5 rounded-[18px] bg-[#F4EBE1] border border-[#E3D4C1] shadow-sm flex flex-col justify-between">
          <span className="text-[#635545] text-[0.95rem] font-medium mb-3">Relay Pending</span>
          <strong className="text-4xl font-bold text-[#3B2E1E]">{batchStats.relayPending}</strong>
        </div>

        <div className="p-5 rounded-[18px] bg-[#E8EFE5] border border-[#CFDAC9] shadow-sm flex flex-col justify-between">
          <span className="text-[#45523E] text-[0.95rem] font-medium mb-3">Consumer Consumed</span>
          <strong className="text-4xl font-bold text-[#2A3624]">{batchStats.consumer_consumed}</strong>
        </div>

        <div className="p-5 rounded-[18px] bg-[#F5E6E6] border border-[#EAC9C9] shadow-sm flex flex-col justify-between">
          <span className="text-[#6D4C4C] text-[0.95rem] font-medium mb-3">Inconsistent Runs</span>
          <strong className="text-4xl font-bold text-[#4A2626]">{batchStats.inconsistentRuns}</strong>
        </div>


      </div>
    </section>
        </section>
        
        <section className="mb-5 p-6 bg-[rgba(255,250,243,0.88)] backdrop-blur-md rounded-[24px] border border-[#1f1b17]/10 shadow-[0_18px_44px_rgba(58,38,17,0.12)]">
          <div className="mb-[18px]">
            <h2 className="m-0 text-2xl font-bold">Global Statistics</h2>
            <p className="m-0 mt-2 text-[#6c6459] leading-[1.5]">Aggregate numbers across recent tracked runs in this server process.</p>
          </div>
          <div id="global-stats" className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
            {/* Dynamically injected content goes here */}
          </div>
          <div id="outbox-counts" className="flex flex-wrap gap-2.5 mt-4">
             {/* Dynamically injected pills go here */}
          </div>
        </section>


        <section className="mb-5 p-6 md:p-8 bg-[rgba(255,250,243,0.95)] backdrop-blur-md rounded-[24px] border border-[#1f1b17]/10 shadow-[0_18px_44px_rgba(58,38,17,0.08)]">
      <div className="mb-6">
        <h2 className="m-0 text-xl md:text-2xl font-bold text-[#1E1B17] tracking-wide">
          Get Database Data
        </h2>
        <p className="m-0 mt-2 text-[#6C6459] text-[0.95rem] leading-[1.5]">
          Inspect raw records from OrderServices related to events and persistence.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={handleGetOrders}
          disabled={isLoading}
          className={`px-5 py-3.5 rounded-[14px] font-semibold transition-all duration-300 shadow-sm border ${
            activeTab === 'orders' 
              ? 'bg-[#F9F5EC] border-[#C25124] text-[#C25124]' 
              : 'bg-white border-[#1f1b17]/15 text-[#45382A] hover:bg-[#F9F5EC]'
          }`}
        >
          {isLoading && activeTab === 'orders' ? 'Loading...' : 'Get Orders'}
        </button>

        <button 
          onClick={handleGetOutbox}
          disabled={isLoading}
          className={`px-5 py-3.5 rounded-[14px] font-semibold transition-all duration-300 shadow-sm border ${
            activeTab === 'outbox' 
              ? 'bg-[#F9F5EC] border-[#C25124] text-[#C25124]' 
              : 'bg-white border-[#1f1b17]/15 text-[#45382A] hover:bg-[#F9F5EC]'
          }`}
        >
          {isLoading && activeTab === 'outbox' ? 'Loading...' : 'Get Transactional Outbox'}
        </button>

        <button 
          onClick={handleGetListenOutbox}
          disabled={isLoading}
          className={`px-5 py-3.5 rounded-[14px] font-semibold transition-all duration-300 shadow-sm border ${
            activeTab === 'listen' 
              ? 'bg-[#F9F5EC] border-[#C25124] text-[#C25124]' 
              : 'bg-white border-[#1f1b17]/15 text-[#45382A] hover:bg-[#F9F5EC]'
          }`}
        >
          {isLoading && activeTab === 'listen' ? 'Loading...' : 'Get Listen To Yourself'}
        </button>
      </div>

      <div className="mt-6 rounded-[16px] bg-[#2A241D] border border-[#3B3228] shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] overflow-hidden">
        <div className="px-4 py-2 bg-[#1E1B17] border-b border-[#3B3228] flex items-center justify-between">
          <span className="text-xs font-mono text-[#A89887] uppercase tracking-wider">Server Response Viewer</span>
          {dbData && (
             <span className="text-xs font-mono text-[#78A65E]">Status: 200 OK</span>
          )}
        </div>
        <div className="p-5 overflow-x-auto min-h-[250px] max-h-[400px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-[#A89887] font-mono text-sm animate-pulse">
              Fetching records from database...
            </div>
          ) : dbData ? (
            <pre className="m-0 text-[#EBE3D3] font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(dbData, null, 2)}
            </pre>
          ) : (
            <div className="flex h-full items-center justify-center text-[#5F5449] font-mono text-sm">
              // Click a button above to execute query
            </div>
          )}
        </div>
      </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <section className="p-6 bg-[rgba(255,250,243,0.88)] backdrop-blur-md rounded-[24px] border border-[#1f1b17]/10 shadow-[0_18px_44px_rgba(58,38,17,0.12)]">
            <div className="mb-[18px]">
              <h2 className="m-0 text-2xl font-bold">Relay Cycle Graph</h2>
              <p className="m-0 mt-2 text-[#6c6459] leading-[1.5]">See the relay stop when the outbox is empty and watch later cycles complete the remaining events.</p>
            </div>
            <div id="relay-status" className="text-[#6c6459] text-[0.9rem] leading-[1.5] p-[14px_16px] rounded-[14px] bg-white/50 border border-dashed border-[#1f1b17]/10 mb-4">
              Relay sleeping. No outbox work right now.
            </div>
            <div id="cycle-graph" className="grid grid-cols-[repeat(auto-fit,minmax(68px,1fr))] gap-3 min-h-[220px] items-end p-[18px] rounded-[20px] bg-[#fffaf3] border border-[#1f1b17]/10">
                {/* Dynamically injected graph bars go here */}
            </div>
            <div id="cycle-summary" className="mt-[14px] text-[#6c6459]">No relay cycles yet.</div>
            <div id="cycle-analysis" className="grid gap-3 mt-4"></div>
          </section>

          <section className="p-6 bg-[rgba(255,250,243,0.88)] backdrop-blur-md rounded-[24px] border border-[#1f1b17]/10 shadow-[0_18px_44px_rgba(58,38,17,0.12)]">
            <div className="mb-[18px]">
              <h2 className="m-0 text-2xl font-bold">Recent Orders In Database</h2>
              <p className="m-0 mt-2 text-[#6c6459] leading-[1.5]">These rows prove what committed locally, even before Kafka catches up.</p>
            </div>
            <div id="orders-list" className="grid gap-3">
                 {/* Dynamically injected list cards go here */}
            </div>
          </section>
        </section>

        {/* BOTTOM GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="p-6 bg-[rgba(255,250,243,0.88)] backdrop-blur-md rounded-[24px] border border-[#1f1b17]/10 shadow-[0_18px_44px_rgba(58,38,17,0.12)]">
            <div className="mb-[18px]">
              <h2 className="m-0 text-2xl font-bold">Latest Batch Results</h2>
              <p className="m-0 mt-2 text-[#6c6459] leading-[1.5]">Each row shows DB, outbox, Kafka, relay status, and any latest error.</p>
            </div>
            <div id="batch-results" className="overflow-auto">
               {/* Dynamically injected table goes here */}
            </div>
          </section>

          <section className="p-6 bg-[rgba(255,250,243,0.88)] backdrop-blur-md rounded-[24px] border border-[#1f1b17]/10 shadow-[0_18px_44px_rgba(58,38,17,0.12)]">
            <div className="mb-[18px]">
              <h2 className="m-0 text-2xl font-bold">Recent Outbox Messages</h2>
              <p className="m-0 mt-2 text-[#6c6459] leading-[1.5]">These rows show retry attempts, status, and the probability attached to each event.</p>
            </div>
            <div id="outbox-list" className="grid gap-3">
                 {/* Dynamically injected list cards go here */}
            </div>
          </section>
        </section>
        
      </main>
    </div>
  );
}
