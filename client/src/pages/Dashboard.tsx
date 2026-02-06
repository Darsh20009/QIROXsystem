import { Layout } from "@/components/Layout";
import { useUser } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { useOrders } from "@/hooks/use-orders";
import { Loader2, Plus, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const [, setLocation] = useLocation();

  if (userLoading || projectsLoading || ordersLoading) {
    return (
      <Layout>
        <div className="h-[80vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  // Calculate stats
  const activeProjects = projects?.filter(p => p.status !== 'delivered').length || 0;
  const completedProjects = projects?.filter(p => p.status === 'delivered').length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user.fullName}</p>
          </div>
          <Link href="/services">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> New Order
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatsCard 
            title="Active Projects" 
            value={activeProjects} 
            icon={<Clock className="w-6 h-6 text-blue-400" />} 
            color="bg-blue-500/10 border-blue-500/20"
          />
          <StatsCard 
            title="Completed" 
            value={completedProjects} 
            icon={<CheckCircle2 className="w-6 h-6 text-emerald-400" />} 
            color="bg-emerald-500/10 border-emerald-500/20"
          />
          <StatsCard 
            title="Pending Orders" 
            value={pendingOrders} 
            icon={<AlertCircle className="w-6 h-6 text-amber-400" />} 
            color="bg-amber-500/10 border-amber-500/20"
          />
        </div>

        {/* Projects Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Active Projects
          </h2>
          
          {projects && projects.length > 0 ? (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="glass-card p-6 rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                        <span className="font-semibold text-lg">Project #{project.id}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Started {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'Not started'}
                      </span>
                    </div>
                    
                    <div className="w-full bg-secondary/50 rounded-full h-2 mb-4 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Status: <span className="text-foreground capitalize">{project.status}</span></span>
                      <span>{project.progress}% Complete</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 glass-card rounded-xl">
              <p className="text-muted-foreground mb-4">No active projects yet</p>
              <Link href="/services">
                <Button variant="outline">Start a Project</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Orders Section */}
        <div>
          <h2 className="text-xl font-bold mb-6">Recent Orders</h2>
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-4 font-medium text-sm text-muted-foreground">Order ID</th>
                  <th className="p-4 font-medium text-sm text-muted-foreground">Status</th>
                  <th className="p-4 font-medium text-sm text-muted-foreground">Amount</th>
                  <th className="p-4 font-medium text-sm text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">#{order.id}</td>
                    <td className="p-4 capitalize">
                      <span className={`px-2 py-1 rounded text-xs border ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">${order.totalAmount}</td>
                    <td className="p-4 text-muted-foreground">
                      {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : '-'}
                    </td>
                  </tr>
                ))}
                {(!orders || orders.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatsCard({ title, value, icon, color }: any) {
  return (
    <div className={`glass-card p-6 rounded-xl border ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-4xl font-bold font-display">{value}</div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'delivered': return 'bg-emerald-500';
    case 'development': return 'bg-blue-500';
    case 'review': return 'bg-purple-500';
    case 'new': return 'bg-slate-500';
    default: return 'bg-gray-500';
  }
}

function getOrderStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
}
