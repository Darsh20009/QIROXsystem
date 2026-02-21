import {
  type User, type InsertUser, type Service, type InsertService,
  type Order, type InsertOrder, type Project, type InsertProject,
  type Task, type InsertTask, type Message, type InsertMessage,
  type Attendance, type InsertAttendance, type ProjectVault, type InsertProjectVault,
  type ProjectMember, type InsertProjectMember,
  type News, type InsertNews, type Job, type InsertJob, type Application, type InsertApplication,
  type SectorTemplate, type InsertSectorTemplate, type PricingPlan, type InsertPricingPlan
} from "@shared/schema";
import {
  UserModel, ServiceModel, OrderModel, ProjectModel, TaskModel, MessageModel, AttendanceModel, ProjectVaultModel, ProjectMemberModel,
  NewsModel, JobModel, ApplicationModel, SectorTemplateModel, PricingPlanModel
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

  // News CMS
  getNews(): Promise<News[]>;
  createNews(news: InsertNews): Promise<News>;
  updateNews(id: string, updates: Partial<InsertNews>): Promise<News>;

  // Recruitment
  getJobs(): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<InsertJob>): Promise<Job>;
  getApplications(jobId?: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: string, updates: Partial<InsertApplication>): Promise<Application>;

  // Sector Templates
  getSectorTemplates(): Promise<SectorTemplate[]>;
  getSectorTemplate(id: string): Promise<SectorTemplate | undefined>;
  getSectorTemplateBySlug(slug: string): Promise<SectorTemplate | undefined>;
  createSectorTemplate(template: InsertSectorTemplate): Promise<SectorTemplate>;
  updateSectorTemplate(id: string, updates: Partial<InsertSectorTemplate>): Promise<SectorTemplate>;
  deleteSectorTemplate(id: string): Promise<void>;

  // Pricing Plans
  getPricingPlans(): Promise<PricingPlan[]>;
  getPricingPlan(id: string): Promise<PricingPlan | undefined>;
  createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan>;
  updatePricingPlan(id: string, updates: Partial<InsertPricingPlan>): Promise<PricingPlan>;
  deletePricingPlan(id: string): Promise<void>;
}

export class MongoStorage implements IStorage {
  async getTasks(projectId: string, parentId?: string): Promise<Task[]> {
    const query = parentId ? { projectId, parentId } : { projectId, parentId: { $exists: false } };
    const tasks = await TaskModel.find(query);
    return tasks.map(t => ({ ...t.toObject(), id: Number(t._id.toString()) }));
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const members = await ProjectMemberModel.find({ projectId });
    return members.map(m => ({ ...m.toObject(), id: Number(m._id.toString()) }));
  }

  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const newMember = await ProjectMemberModel.create(member);
    return { ...newMember.toObject(), id: Number(newMember._id.toString()) };
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    return user ? { ...user.toObject(), id: Number(user._id.toString()) } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? { ...user.toObject(), id: Number(user._id.toString()) } : undefined;
  }

  async getUsers(): Promise<User[]> {
    const users = await UserModel.find();
    return users.map(u => ({ ...u.toObject(), id: Number(u._id.toString()) }));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await UserModel.create(insertUser);
    return { ...user.toObject(), id: Number(user._id.toString()) };
  }

  async getAttendance(userId: string): Promise<Attendance[]> {
    const attendances = await AttendanceModel.find({ userId });
    return attendances.map(a => ({ ...a.toObject(), id: Number(a._id.toString()) }));
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const newAttendance = await AttendanceModel.create(attendance);
    return { ...newAttendance.toObject(), id: Number(newAttendance._id.toString()) };
  }

  async updateAttendance(id: string, updates: Partial<InsertAttendance>): Promise<Attendance> {
    const attendance = await AttendanceModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...attendance.toObject(), id: Number(attendance._id.toString()) };
  }

  async getLatestAttendance(userId: string): Promise<Attendance | undefined> {
    const attendance = await AttendanceModel.findOne({ userId }).sort({ checkIn: -1 });
    return attendance ? { ...attendance.toObject(), id: Number(attendance._id.toString()) } : undefined;
  }

  async getServices(): Promise<Service[]> {
    const services = await ServiceModel.find();
    return services.map(s => ({ ...s.toObject(), id: Number(s._id.toString()) }));
  }

  async getService(id: string): Promise<Service | undefined> {
    const service = await ServiceModel.findById(id);
    return service ? { ...service.toObject(), id: Number(service._id.toString()) } : undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const newService = await ServiceModel.create(service);
    return { ...newService.toObject(), id: Number(newService._id.toString()) };
  }

  async getOrders(userId?: string): Promise<Order[]> {
    const query = userId ? { userId } : {};
    const orders = await OrderModel.find(query);
    return orders.map(o => ({ ...o.toObject(), id: Number(o._id.toString()) }));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder = await OrderModel.create(order);
    return { ...newOrder.toObject(), id: Number(newOrder._id.toString()) };
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const order = await OrderModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...order.toObject(), id: Number(order._id.toString()) };
  }

  async getProjects(userId?: string, role?: string): Promise<Project[]> {
    let query = {};
    if (userId) {
      query = role === 'client' ? { clientId: userId } : { managerId: userId };
    }
    const projects = await ProjectModel.find(query);
    return projects.map(p => ({ ...p.toObject(), id: Number(p._id.toString()) }));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const project = await ProjectModel.findById(id);
    return project ? { ...project.toObject(), id: Number(project._id.toString()) } : undefined;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const project = await ProjectModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...project.toObject(), id: Number(project._id.toString()) };
  }

  async createTask(task: InsertTask): Promise<Task> {
    const newTask = await TaskModel.create(task);
    return { ...newTask.toObject(), id: Number(newTask._id.toString()) };
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const task = await TaskModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...task.toObject(), id: Number(task._id.toString()) };
  }

  async getMessages(projectId: string): Promise<Message[]> {
    const messages = await MessageModel.find({ projectId });
    return messages.map(m => ({ ...m.toObject(), id: Number(m._id.toString()) }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage = await MessageModel.create(message);
    return { ...newMessage.toObject(), id: Number(newMessage._id.toString()) };
  }

  // Project Vault
  async getVaultItems(projectId: string): Promise<ProjectVault[]> {
    const items = await ProjectVaultModel.find({ projectId });
    return items.map(i => ({ ...i.toObject(), id: Number(i._id.toString()) }));
  }

  async createVaultItem(item: InsertProjectVault): Promise<ProjectVault> {
    const newItem = await ProjectVaultModel.create(item);
    return { ...newItem.toObject(), id: Number(newItem._id.toString()) };
  }

  async updateVaultItem(id: string, updates: Partial<InsertProjectVault>): Promise<ProjectVault> {
    const item = await ProjectVaultModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...item.toObject(), id: Number(item._id.toString()) };
  }

  // News
  async getNews(): Promise<News[]> {
    const items = await NewsModel.find().sort({ publishedAt: -1 });
    return items.map(i => ({ ...i.toObject(), id: Number(i._id.toString()) }));
  }

  async createNews(news: InsertNews): Promise<News> {
    const item = await NewsModel.create(news);
    return { ...item.toObject(), id: Number(item._id.toString()) };
  }

  async updateNews(id: string, updates: Partial<InsertNews>): Promise<News> {
    const item = await NewsModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...item.toObject(), id: Number(item._id.toString()) };
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    const items = await JobModel.find().sort({ createdAt: -1 });
    return items.map(i => ({ ...i.toObject(), id: Number(i._id.toString()) }));
  }

  async createJob(job: InsertJob): Promise<Job> {
    const item = await JobModel.create(job);
    return { ...item.toObject(), id: Number(item._id.toString()) };
  }

  async updateJob(id: string, updates: Partial<InsertJob>): Promise<Job> {
    const item = await JobModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...item.toObject(), id: Number(item._id.toString()) };
  }

  async getApplications(jobId?: string): Promise<Application[]> {
    const query = jobId ? { jobId } : {};
    const items = await ApplicationModel.find(query).sort({ appliedAt: -1 });
    return items.map(i => ({ ...i.toObject(), id: Number(i._id.toString()) }));
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const item = await ApplicationModel.create(application);
    return { ...item.toObject(), id: Number(item._id.toString()) };
  }

  async updateApplication(id: string, updates: Partial<InsertApplication>): Promise<Application> {
    const item = await ApplicationModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...item.toObject(), id: Number(item._id.toString()) };
  }

  // Sector Templates
  async getSectorTemplates(): Promise<SectorTemplate[]> {
    const items = await SectorTemplateModel.find().sort({ sortOrder: 1 });
    return items.map(i => ({ ...i.toObject(), id: i._id.toString() })) as SectorTemplate[];
  }

  async getSectorTemplate(id: string): Promise<SectorTemplate | undefined> {
    const item = await SectorTemplateModel.findById(id);
    return item ? ({ ...item.toObject(), id: item._id.toString() } as SectorTemplate) : undefined;
  }

  async getSectorTemplateBySlug(slug: string): Promise<SectorTemplate | undefined> {
    const item = await SectorTemplateModel.findOne({ slug });
    return item ? ({ ...item.toObject(), id: item._id.toString() } as SectorTemplate) : undefined;
  }

  async createSectorTemplate(template: InsertSectorTemplate): Promise<SectorTemplate> {
    const item = await SectorTemplateModel.create(template);
    return { ...item.toObject(), id: item._id.toString() } as SectorTemplate;
  }

  async updateSectorTemplate(id: string, updates: Partial<InsertSectorTemplate>): Promise<SectorTemplate> {
    const item = await SectorTemplateModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...item.toObject(), id: item._id.toString() } as SectorTemplate;
  }

  async deleteSectorTemplate(id: string): Promise<void> {
    await SectorTemplateModel.findByIdAndDelete(id);
  }

  // Pricing Plans
  async getPricingPlans(): Promise<PricingPlan[]> {
    const items = await PricingPlanModel.find({ status: "active" }).sort({ sortOrder: 1 });
    return items.map(i => ({ ...i.toObject(), id: i._id.toString() })) as PricingPlan[];
  }

  async getPricingPlan(id: string): Promise<PricingPlan | undefined> {
    const item = await PricingPlanModel.findById(id);
    return item ? ({ ...item.toObject(), id: item._id.toString() } as PricingPlan) : undefined;
  }

  async createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan> {
    const item = await PricingPlanModel.create(plan);
    return { ...item.toObject(), id: item._id.toString() } as PricingPlan;
  }

  async updatePricingPlan(id: string, updates: Partial<InsertPricingPlan>): Promise<PricingPlan> {
    const item = await PricingPlanModel.findByIdAndUpdate(id, updates, { new: true });
    return { ...item.toObject(), id: item._id.toString() } as PricingPlan;
  }

  async deletePricingPlan(id: string): Promise<void> {
    await PricingPlanModel.findByIdAndDelete(id);
  }
}

export const storage = new MongoStorage();
