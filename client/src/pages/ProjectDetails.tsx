import { Layout } from "@/components/Layout";
import { useProject } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useParams, useLocation } from "wouter";
import { Loader2, MessageSquare, ListTodo, FileCode, Github, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProjectDetails() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data: project, isLoading } = useProject(projectId);
  const { data: tasks } = useTasks(projectId);
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <Layout><div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div></Layout>;
  }

  if (!project) {
    return <Layout><div className="text-center p-20">Project not found</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold font-display">Project #{project.id}</h1>
              <Badge variant="outline" className="capitalize border-primary/50 text-primary">{project.status}</Badge>
            </div>
            <p className="text-muted-foreground">Managed by: {project.managerId ? `Manager #${project.managerId}` : 'Unassigned'}</p>
          </div>
          
          <div className="flex gap-3">
            {project.repoUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(project.repoUrl, '_blank')}>
                <Github className="w-4 h-4 mr-2" /> Repository
              </Button>
            )}
            {project.stagingUrl && (
              <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => window.open(project.stagingUrl, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" /> Live Demo
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="glass-card p-6 rounded-xl mb-8">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold text-primary">{project.progress}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/30 p-1 mb-6">
            <TabsTrigger value="tasks">
              <ListTodo className="w-4 h-4 mr-2" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" /> Messages
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileCode className="w-4 h-4 mr-2" /> Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="glass-card rounded-xl p-6 min-h-[400px]">
            <h3 className="text-xl font-bold mb-4">Project Tasks</h3>
            <div className="space-y-3">
              {tasks?.map((task) => (
                <div key={task.id} className="p-4 rounded-lg bg-background/40 border border-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.description || 'No description'}</p>
                  </div>
                  <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                    {task.status}
                  </Badge>
                </div>
              ))}
              {(!tasks || tasks.length === 0) && (
                <div className="text-center py-10 text-muted-foreground">No tasks visible yet.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="glass-card rounded-xl p-6 min-h-[400px]">
             {/* Simple Mock Chat */}
             <div className="flex flex-col h-[400px]">
               <div className="flex-1 border border-white/5 rounded-lg mb-4 p-4 flex items-center justify-center text-muted-foreground">
                 No messages yet. Start the conversation!
               </div>
               <div className="flex gap-2">
                 <input className="flex-1 glass-input rounded-md px-4 py-2" placeholder="Type a message..." />
                 <Button>Send</Button>
               </div>
             </div>
          </TabsContent>

          <TabsContent value="files" className="glass-card rounded-xl p-6 min-h-[400px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Mock Files */}
              <div className="p-4 border border-white/10 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-white/5 cursor-pointer">
                <FileCode className="w-8 h-8 text-blue-400" />
                <span className="text-sm font-medium">requirements.pdf</span>
              </div>
              <div className="p-4 border border-white/10 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-white/5 cursor-pointer">
                <FileCode className="w-8 h-8 text-emerald-400" />
                <span className="text-sm font-medium">design-v1.fig</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
