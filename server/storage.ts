import {
  type User, type InsertUser, type Service, type InsertService,
  type Order, type InsertOrder, type Project, type InsertProject,
  type Task, type InsertTask, type Message, type InsertMessage,
  type Attendance, type InsertAttendance, type ProjectVault, type InsertProjectVault,
  type ProjectMember, type InsertProjectMember
} from "@shared/schema";
import {
  UserModel, ServiceModel, OrderModel, ProjectModel, TaskModel, MessageModel, AttendanceModel, ProjectVaultModel, ProjectMemberModel
} from "./models";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;

  // Attendance
  getAttendance(userId: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, updates: Partial<InsertAttendance>): Promise<Attendance>;
  getLatestAttendance(userId: string): Promise<Attendance | undefined>;

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
  getTasks(projectId: string, parentId?: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;

  // Messages
  getMessages(projectId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Project Vault
  getVaultItems(projectId: string): Promise<ProjectVault[]>;
  createVaultItem(item: InsertProjectVault): Promise<ProjectVault>;
  updateVaultItem(id: string, updates: Partial<InsertProjectVault>): Promise<ProjectVault>;

  // Project Members
  getProjectMembers(projectId: string): Promise<ProjectMember[]>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
}

export class MongoStorage implements IStorage {
  async getTasks(projectId: string, parentId?: string): Promise<Task[]> {
    const query = parentId ? { projectId, parentId } : { projectId, parentId: { $exists: false } };
    const tasks = await TaskModel.find(query);
    return tasks.map(t => ({ ...t.toObject(), id: t._id.toString() }));
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const members = await ProjectMemberModel.find({ projectId });
    return members.map(m => ({ ...m.toObject(), id: m._id.toString() }));
  }

  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const newMember = await ProjectMemberModel.create(member);
    return { ...newMember.toObject(), id: newMember._id.toString() };
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    return user ? { ...user.toObject(), id: user._id.toString() } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? { ...user.toObject(), id: user._id.toString() } : undefined;
  }

  async getUsers(): Promise<User[]> {
    const users = await UserModel.find();
    return users.map(u => ({ ...u.toObject(), id: u._id.toString() }));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await UserModel.create(insertUser);
    return { ...user.toObject(), id: user._id.toString() };
  }

  async getAttendance(userId: string): Promise<Attendance[]> {
    const attendances = await AttendanceModel.find({ userId });
    return attendances.map(a => ({ ...a.toObject(), id: a._id.toString() }));
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const newAttendance = await AttendanceModel.create(attendance);
    return { ...newAttendance.toObject(), id: newAttendance._id.toString() };
  }

  async updateAttendance(id: string, updates: Partial<InsertAttendance>): Promise<Attendance> {
    const attendance = await AttendanceModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...attendance.toObject(), id: attendance._id.toString() };
  }

  async getLatestAttendance(userId: string): Promise<Attendance | undefined> {
    const attendance = await AttendanceModel.findOne({ userId }).sort({ checkIn: -1 });
    return attendance ? { ...attendance.toObject(), id: attendance._id.toString() } : undefined;
  }

  async getServices(): Promise<Service[]> {
    const services = await ServiceModel.find();
    return services.map(s => ({ ...s.toObject(), id: s._id.toString() }));
  }

  async getService(id: string): Promise<Service | undefined> {
    const service = await ServiceModel.findById(id);
    return service ? { ...service.toObject(), id: service._id.toString() } : undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const newService = await ServiceModel.create(service);
    return { ...newService.toObject(), id: newService._id.toString() };
  }

  async getOrders(userId?: string): Promise<Order[]> {
    const query = userId ? { userId } : {};
    const orders = await OrderModel.find(query);
    return orders.map(o => ({ ...o.toObject(), id: o._id.toString() }));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder = await OrderModel.create(order);
    return { ...newOrder.toObject(), id: newOrder._id.toString() };
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const order = await OrderModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...order.toObject(), id: order._id.toString() };
  }

  async getProjects(userId?: string, role?: string): Promise<Project[]> {
    let query = {};
    if (userId) {
      query = role === 'client' ? { clientId: userId } : { managerId: userId };
    }
    const projects = await ProjectModel.find(query);
    return projects.map(p => ({ ...p.toObject(), id: p._id.toString() }));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const project = await ProjectModel.findById(id);
    return project ? { ...project.toObject(), id: project._id.toString() } : undefined;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const project = await ProjectModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...project.toObject(), id: project._id.toString() };
  }

  async createTask(task: InsertTask): Promise<Task> {
    const newTask = await TaskModel.create(task);
    return { ...newTask.toObject(), id: newTask._id.toString() };
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const task = await TaskModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...task.toObject(), id: task._id.toString() };
  }

  async getMessages(projectId: string): Promise<Message[]> {
    const messages = await MessageModel.find({ projectId });
    return messages.map(m => ({ ...m.toObject(), id: m._id.toString() }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage = await MessageModel.create(message);
    return { ...newMessage.toObject(), id: newMessage._id.toString() };
  }

  // Project Vault
  async getVaultItems(projectId: string): Promise<ProjectVault[]> {
    const items = await ProjectVaultModel.find({ projectId });
    return items.map(i => ({ ...i.toObject(), id: i._id.toString() }));
  }

  async createVaultItem(item: InsertProjectVault): Promise<ProjectVault> {
    const newItem = await ProjectVaultModel.create(item);
    return { ...newItem.toObject(), id: newItem._id.toString() };
  }

  async updateVaultItem(id: string, updates: Partial<InsertProjectVault>): Promise<ProjectVault> {
    const item = await ProjectVaultModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...item.toObject(), id: item._id.toString() };
  }
}

export const storage = new MongoStorage();
