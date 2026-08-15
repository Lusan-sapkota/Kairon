export namespace main {
	
	export class AppNotification {
	    id: number;
	    kind: string;
	    title: string;
	    body: string;
	    dedupeKey: string;
	    read: boolean;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new AppNotification(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.kind = source["kind"];
	        this.title = source["title"];
	        this.body = source["body"];
	        this.dedupeKey = source["dedupeKey"];
	        this.read = source["read"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class DataLocations {
	    configDir: string;
	    database: string;
	
	    static createFrom(source: any = {}) {
	        return new DataLocations(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.configDir = source["configDir"];
	        this.database = source["database"];
	    }
	}
	export class MailPrefs {
	    enabled: boolean;
	    dailyEnabled: boolean;
	    dailyTime: string;
	    weeklyEnabled: boolean;
	    weeklyDay: number;
	    weeklyTime: string;
	    dueToday: boolean;
	    dueSoon1: boolean;
	    dueSoon2: boolean;
	    dueSoon3: boolean;
	    overdue: boolean;
	    includeNoDue: boolean;
	    includeCompleted: boolean;
	    queueTTL: string;
	
	    static createFrom(source: any = {}) {
	        return new MailPrefs(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.dailyEnabled = source["dailyEnabled"];
	        this.dailyTime = source["dailyTime"];
	        this.weeklyEnabled = source["weeklyEnabled"];
	        this.weeklyDay = source["weeklyDay"];
	        this.weeklyTime = source["weeklyTime"];
	        this.dueToday = source["dueToday"];
	        this.dueSoon1 = source["dueSoon1"];
	        this.dueSoon2 = source["dueSoon2"];
	        this.dueSoon3 = source["dueSoon3"];
	        this.overdue = source["overdue"];
	        this.includeNoDue = source["includeNoDue"];
	        this.includeCompleted = source["includeCompleted"];
	        this.queueTTL = source["queueTTL"];
	    }
	}
	export class MailQueueItem {
	    id: number;
	    kind: string;
	    dedupeKey: string;
	    recipient: string;
	    subject: string;
	    status: string;
	    attempts: number;
	    maxAttempts: number;
	    nextAttemptAt: string;
	    expiresAt: string;
	    lastError: string;
	    createdAt: string;
	    sentAt?: string;
	
	    static createFrom(source: any = {}) {
	        return new MailQueueItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.kind = source["kind"];
	        this.dedupeKey = source["dedupeKey"];
	        this.recipient = source["recipient"];
	        this.subject = source["subject"];
	        this.status = source["status"];
	        this.attempts = source["attempts"];
	        this.maxAttempts = source["maxAttempts"];
	        this.nextAttemptAt = source["nextAttemptAt"];
	        this.expiresAt = source["expiresAt"];
	        this.lastError = source["lastError"];
	        this.createdAt = source["createdAt"];
	        this.sentAt = source["sentAt"];
	    }
	}
	export class MailQueueStats {
	    pending: number;
	    failed: number;
	    expired: number;
	    sent: number;
	
	    static createFrom(source: any = {}) {
	        return new MailQueueStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pending = source["pending"];
	        this.failed = source["failed"];
	        this.expired = source["expired"];
	        this.sent = source["sent"];
	    }
	}
	export class SMTPConfig {
	    host: string;
	    port: number;
	    username: string;
	    password?: string;
	    passwordSet: boolean;
	    fromName: string;
	    fromEmail: string;
	    toEmail: string;
	    security: string;
	
	    static createFrom(source: any = {}) {
	        return new SMTPConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.host = source["host"];
	        this.port = source["port"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.passwordSet = source["passwordSet"];
	        this.fromName = source["fromName"];
	        this.fromEmail = source["fromEmail"];
	        this.toEmail = source["toEmail"];
	        this.security = source["security"];
	    }
	}
	export class MailSettings {
	    smtp: SMTPConfig;
	    prefs: MailPrefs;
	
	    static createFrom(source: any = {}) {
	        return new MailSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.smtp = this.convertValues(source["smtp"], SMTPConfig);
	        this.prefs = this.convertValues(source["prefs"], MailPrefs);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
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
	export class NotifyPrefs {
	    enabled: boolean;
	    desktop: boolean;
	    inApp: boolean;
	    dailyEnabled: boolean;
	    dailyTime: string;
	    weeklyEnabled: boolean;
	    weeklyDay: number;
	    weeklyTime: string;
	    dueToday: boolean;
	    dueSoon1: boolean;
	    dueSoon2: boolean;
	    dueSoon3: boolean;
	    overdue: boolean;
	
	    static createFrom(source: any = {}) {
	        return new NotifyPrefs(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.desktop = source["desktop"];
	        this.inApp = source["inApp"];
	        this.dailyEnabled = source["dailyEnabled"];
	        this.dailyTime = source["dailyTime"];
	        this.weeklyEnabled = source["weeklyEnabled"];
	        this.weeklyDay = source["weeklyDay"];
	        this.weeklyTime = source["weeklyTime"];
	        this.dueToday = source["dueToday"];
	        this.dueSoon1 = source["dueSoon1"];
	        this.dueSoon2 = source["dueSoon2"];
	        this.dueSoon3 = source["dueSoon3"];
	        this.overdue = source["overdue"];
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
	    repeat: string;
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
	        this.repeat = source["repeat"];
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
	    repeat: string;
	
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
	        this.repeat = source["repeat"];
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

