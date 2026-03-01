import {
    Briefcase,
    CheckCircle, Cpu,
    Database,
    Globe,
    LayoutGrid,
    PencilRuler,
    Server,
    Settings, Shield,
    Smartphone,
    Terminal
} from "lucide-react";
import React from "react";

export const CATEGORIES = [
    { name: 'All', icon: <LayoutGrid className="w-3.5 h-3.5" />, roles: [] },
    { name: 'Frontend', icon: <Globe className="w-3.5 h-3.5" />, roles: ['Frontend Developer'] },
    { name: 'Backend', icon: <Server className="w-3.5 h-3.5" />, roles: ['Backend Developer', 'Cloud Engineer'] },
    { name: 'Fullstack', icon: <Terminal className="w-3.5 h-3.5" />, roles: ['Fullstack Developer'] },
    { name: 'Mobile', icon: <Smartphone className="w-3.5 h-3.5" />, roles: ['Mobile Developer'] },
    { name: 'Data & AI', icon: <Database className="w-3.5 h-3.5" />, roles: ['Data Scientist', 'Data Analyst', 'ML Engineer', 'AI Prompt Engineer'] },
    { name: 'DevOps', icon: <Settings className="w-3.5 h-3.5" />, roles: ['DevOps Engineer', 'System Administrator'] },
    { name: 'QA', icon: <CheckCircle className="w-3.5 h-3.5" />, roles: ['QA Engineer', 'QA Automation'] },
    { name: 'Design', icon: <PencilRuler className="w-3.5 h-3.5" />, roles: ['UX/UI Designer'] },
    { name: 'Management', icon: <Briefcase className="w-3.5 h-3.5" />, roles: ['Project Manager', 'Product Manager', 'System Analyst'] },
    { name: 'Hardware', icon: <Cpu className="w-3.5 h-3.5" />, roles: ['Embedded Developer', 'Game Developer'] },
    { name: 'Security', icon: <Shield className="w-3.5 h-3.5" />, roles: ['Cybersecurity Specialist'] },
];
