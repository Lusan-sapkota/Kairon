export namespace main {
	
	export class Note {
	    id: number;
	    projectId?: number;
	    taskId?: number;
	    title: string;
	    content: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Note(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.taskId = source["taskId"];
	        this.title = source["title"];
	        this.content = source["content"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class NoteInput {
	    id: number;
	    projectId?: number;
	    title: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new NoteInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.title = source["title"];
	        this.content = source["content"];
	    }
	}
	export class Project {
	    id: number;
	    name: string;
	    color: string;
	    tags: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.color = source["color"];
	        this.tags = source["tags"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class ProjectInput {
	    id: number;
	    name: string;
	    color: string;
	    tags: string;
	
	    static createFrom(source: any = {}) {
	        return new ProjectInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.color = source["color"];
	        this.tags = source["tags"];
	    }
	}
	export class Task {
	    id: number;
	    projectId?: number;
	    title: string;
	    notes: string;
	    done: boolean;
	    priority: number;
	    dueDate?: string;
	    sortOrder: number;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Task(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.title = source["title"];
	        this.notes = source["notes"];
	        this.done = source["done"];
	        this.priority = source["priority"];
	        this.dueDate = source["dueDate"];
	        this.sortOrder = source["sortOrder"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class TaskInput {
	    id: number;
	    projectId?: number;
	    title: string;
	    notes: string;
	    priority: number;
	    dueDate?: string;
	
	    static createFrom(source: any = {}) {
	        return new TaskInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.title = source["title"];
	        this.notes = source["notes"];
	        this.priority = source["priority"];
	        this.dueDate = source["dueDate"];
	    }
	}
	export class UpdateInfo {
	    state: string;
	    currentVersion: string;
	    version: string;
	    installMode: string;
	    canAutoApply: boolean;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.state = source["state"];
	        this.currentVersion = source["currentVersion"];
	        this.version = source["version"];
	        this.installMode = source["installMode"];
	        this.canAutoApply = source["canAutoApply"];
	        this.message = source["message"];
	    }
	}
	export class UpdateSettings {
	    pollInterval: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pollInterval = source["pollInterval"];
	    }
	}

}

