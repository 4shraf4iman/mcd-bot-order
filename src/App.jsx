import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Award, Plus, Minus, CheckCircle, Clock, ChefHat } from 'lucide-react';

class McDonaldsController {
  constructor(onStateChange) {
    this.pendingOrders = [];
    this.completeOrders = [];
    this.bots = [];
    
    this.nextOrderId = 1;
    this.nextBotId = 1;
    
    this.onStateChange = onStateChange;
    
    this.tickInterval = setInterval(() => this.tick(), 1000);
  }

  cleanup() {
    clearInterval(this.tickInterval);
  }

  // Maintains priority: VIPs first, then Normals.
  // Within the same type, ordered by ID (which acts as arrival time).
  sortPendingQueue() {
    this.pendingOrders.sort((a, b) => {
      if (a.isVip && !b.isVip) return -1;
      if (!a.isVip && b.isVip) return 1;
      return a.id - b.id; // Lower ID means older order
    });
  }

  addOrder(isVip) {
    const order = {
      id: this.nextOrderId++,
      isVip: isVip,
    };
    
    this.pendingOrders.push(order);
    this.sortPendingQueue();
    this.assignBots();
    this.onStateChange();
  }

  addBot() {
    const bot = {
      id: this.nextBotId++,
      currentOrder: null,
      timeRemaining: 0,
    };
    
    this.bots.push(bot);
    this.assignBots();
    this.onStateChange();
  }

  removeBot() {
    if (this.bots.length === 0) return;
    
    // Remove the newest bot (last in the array)
    const destroyedBot = this.bots.pop();
    
    // If it was processing an order, return it to pending
    if (destroyedBot.currentOrder) {
      this.pendingOrders.push(destroyedBot.currentOrder);
      this.sortPendingQueue();
      // Unlikely, but just in case another bot is IDLE, assign it immediately
      this.assignBots();
    }
    
    this.onStateChange();
  }

  assignBots() {
    for (const bot of this.bots) {
      // If bot is idle and we have pending orders
      if (!bot.currentOrder && this.pendingOrders.length > 0) {
        bot.currentOrder = this.pendingOrders.shift();
        bot.timeRemaining = 10;
      }
    }
  }

  tick() {
    let stateChanged = false;

    for (const bot of this.bots) {
      if (bot.currentOrder) {
        bot.timeRemaining--;
        stateChanged = true;

        if (bot.timeRemaining <= 0) {
          // Order complete
          this.completeOrders.push(bot.currentOrder);
          bot.currentOrder = null;
          this.assignBots(); // Bot immediately tries to pick up next order
        }
      }
    }

    // Always trigger UI update so progress bars animate
    this.onStateChange();
  }

  getState() {
    return {
      pendingOrders: [...this.pendingOrders],
      completeOrders: [...this.completeOrders],
      bots: [...this.bots],
    };
  }
}

export default function App() {
  const [state, setState] = useState({ pendingOrders: [], completeOrders: [], bots: [] });
  const controllerRef = useRef(null);

  useEffect(() => {
    // Initialize controller and hook it up to React state
    const controller = new McDonaldsController(() => {
      setState(controller.getState());
    });
    
    controllerRef.current = controller;
    setState(controller.getState()); // Initial render state

    return () => {
      controller.cleanup();
    };
  }, []);

  const handleAddNormalOrder = () => controllerRef.current?.addOrder(false);
  const handleAddVipOrder = () => controllerRef.current?.addOrder(true);
  const handleAddBot = () => controllerRef.current?.addBot();
  const handleRemoveBot = () => controllerRef.current?.removeBot();

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 p-3 rounded-full">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">McDonald's Automator</h1>
              <p className="text-sm text-slate-500">Bot Control Center</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleAddNormalOrder}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors border border-slate-300"
            >
              <User size={18} /> New Normal Order
            </button>
            <button 
              onClick={handleAddVipOrder}
              className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg font-medium transition-colors border border-amber-300"
            >
              <Award size={18} /> New VIP Order
            </button>
            <div className="w-px h-10 bg-slate-300 mx-2 hidden md:block"></div>
            <button 
              onClick={handleAddBot}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-200"
            >
              <Plus size={18} /> Add Bot
            </button>
            <button 
              onClick={handleRemoveBot}
              disabled={state.bots.length === 0}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors border border-red-200"
            >
              <Minus size={18} /> Remove Bot
            </button>
          </div>
        </div>

        {/* Dashboards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PENDING COLUMN */}
          <div className="bg-slate-100/50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Clock size={18} className="text-slate-500" /> Pending Orders
              </h2>
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {state.pendingOrders.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {state.pendingOrders.length === 0 && (
                <p className="text-slate-400 text-sm italic text-center py-8">Queue is empty</p>
              )}
              {state.pendingOrders.map((order, idx) => (
                <div 
                  key={order.id} 
                  className={`p-3 rounded-lg shadow-sm border-l-4 flex justify-between items-center bg-white
                    ${order.isVip ? 'border-amber-500' : 'border-blue-500'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {order.isVip ? (
                      <Award className="text-amber-500" size={20} />
                    ) : (
                      <User className="text-blue-500" size={20} />
                    )}
                    <div>
                      <p className="font-medium text-slate-800">Order #{order.id}</p>
                      <p className="text-xs text-slate-500">{order.isVip ? 'VIP Customer' : 'Normal Customer'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Pos: {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BOTS COLUMN */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-200">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Bot size={18} className="text-blue-500" /> Active Bots
              </h2>
              <span className="bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {state.bots.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {state.bots.length === 0 && (
                <p className="text-slate-400 text-sm italic text-center py-8">No active bots. Add one to start processing.</p>
              )}
              {state.bots.map((bot) => (
                <div key={bot.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-bold text-slate-700">Bot #{bot.id}</p>
                    {bot.currentOrder ? (
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-bold animate-pulse">
                        PROCESSING
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded font-bold">
                        IDLE
                      </span>
                    )}
                  </div>
                  
                  {bot.currentOrder ? (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">
                          Order #{bot.currentOrder.id} {bot.currentOrder.isVip ? '(VIP)' : ''}
                        </span>
                        <span className="font-mono text-slate-500">{bot.timeRemaining}s</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-linear ${bot.currentOrder.isVip ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ width: `${((10 - bot.timeRemaining) / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic text-center">
                      Waiting for orders...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COMPLETE COLUMN */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-200">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-500" /> Completed
              </h2>
              <span className="bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {state.completeOrders.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {state.completeOrders.length === 0 && (
                <p className="text-slate-400 text-sm italic text-center py-8">No completed orders yet.</p>
              )}
              {state.completeOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="p-3 rounded-lg shadow-sm border border-emerald-200 flex justify-between items-center bg-white opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-emerald-500" size={20} />
                    <div>
                      <p className="font-medium text-slate-800 line-through decoration-emerald-300">
                        Order #{order.id}
                      </p>
                      <p className="text-xs text-slate-500">{order.isVip ? 'VIP Customer' : 'Normal Customer'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}