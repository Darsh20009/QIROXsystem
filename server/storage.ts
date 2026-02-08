import {
  type User, type InsertUser, type Service, type InsertService,
  type Order, type InsertOrder, type Project, type InsertProject,
  type Task, type InsertTask, type Message, type InsertMessage
} from "@shared/schema";
import {
  UserModel, ServiceModel, OrderModel, ProjectModel, TaskModel, MessageModel
} from "./models";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;

  // Orders
  getOrders(userId?: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;

  // Projects
  getProjects(userId?: string, role?: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;

  // Tasks
  getTasks(projectId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;

  // Messages
  getMessages(projectId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    return user ? user.toObject() : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? user.toObject() : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await UserModel.create(insertUser);
    return user.toObject();
  }

  async getServices(): Promise<Service[]> {
    const services = await ServiceModel.find();
    return services.map(s => s.toObject());
  }

  async getService(id: string): Promise<Service | undefined> {
    const service = await ServiceModel.findById(id);
    return service ? service.toObject() : undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const newService = await ServiceModel.create(service);
    return newService.toObject();
  }

  async getOrders(userId?: string): Promise<Order[]> {
    const query = userId ? { userId } : {};
    const orders = await OrderModel.find(query);
    return orders.map(o => o.toObject());
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder = await OrderModel.create(order);
    return newOrder.toObject();
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const order = await OrderModel.findByIdAndUpdate(id, updates, { new: true });
    return order.toObject();
  }

  async getProjects(userId?: string, role?: string): Promise<Project[]> {
    if (!userId) {
      const projects = await ProjectModel.find();
      return projects.map(p => p.toObject());
    }
    
    const query = role === 'client' ? { clientId: userId } : { managerId: userId };
    const projects = await ProjectModel.find(query);
    return projects.map(p => p.toObject());
  }

  async getProject(id: string): Promise<Project | undefined> {
    const project = await ProjectModel.findById(id);
    return project ? project.toObject() : undefined;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const project = await ProjectModel.findByIdAndUpdate(id, updates, { new: true });
    return project.toObject();
  }

  async getTasks(projectId: string): Promise<Task[]> {
    const tasks = await TaskModel.find({ projectId });
    return tasks.map(t => t.toObject());
  }

  async createTask(task: InsertTask): Promise<Task> {
    const newTask = await TaskModel.create(task);
    return newTask.toObject();
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const task = await TaskModel.findByIdAndUpdate(id, updates, { new: true });
    return task.toObject();
  }

  async getMessages(projectId: string): Promise<Message[]> {
    const messages = await MessageModel.find({ projectId });
    return messages.map(m => m.toObject());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage = await MessageModel.create(message);
    return newMessage.toObject();
  }
}

export const storage = new MongoStorage();
