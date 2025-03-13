import { InsertUser, User, Device, EnergyReading, BudgetAlert } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getDevices(): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  
  getEnergyReadings(deviceId: number): Promise<EnergyReading[]>;
  addEnergyReading(reading: EnergyReading): Promise<void>;
  
  getBudgetAlerts(userId: number): Promise<BudgetAlert[]>;
  setBudgetAlert(userId: number, threshold: number): Promise<void>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private devices: Map<number, Device>;
  private readings: Map<number, EnergyReading[]>;
  private alerts: Map<number, BudgetAlert[]>;
  private currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.readings = new Map();
    this.alerts = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Add some sample devices
    this.devices.set(1, {
      id: 1,
      name: "Living Room AC",
      type: "air_conditioner",
      isActive: true,
      currentUsage: 1.5,
    });
    this.devices.set(2, {
      id: 2,
      name: "Kitchen Refrigerator", 
      type: "refrigerator",
      isActive: true,
      currentUsage: 0.8,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async getEnergyReadings(deviceId: number): Promise<EnergyReading[]> {
    return this.readings.get(deviceId) || [];
  }

  async addEnergyReading(reading: EnergyReading): Promise<void> {
    const deviceReadings = this.readings.get(reading.deviceId) || [];
    deviceReadings.push(reading);
    this.readings.set(reading.deviceId, deviceReadings);
  }

  async getBudgetAlerts(userId: number): Promise<BudgetAlert[]> {
    return this.alerts.get(userId) || [];
  }

  async setBudgetAlert(userId: number, threshold: number): Promise<void> {
    const alert: BudgetAlert = {
      id: this.currentId++,
      userId,
      threshold,
      isEnabled: true,
    };
    const userAlerts = this.alerts.get(userId) || [];
    userAlerts.push(alert);
    this.alerts.set(userId, userAlerts);
  }
}

export const storage = new MemStorage();
