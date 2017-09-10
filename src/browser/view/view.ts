import * as menubar from 'menubar';
interface execType { (): void };

export class Page {
    public mb: any;
    private topFrag: boolean;
    private showDockIcon: boolean;

    constructor(f: string) {
        this.topFrag = false;
        this.showDockIcon = false;

	this.mb = menubar();
	this.mb.setOption('dir',process.cwd());
        this.mb.setOption('tooltip', 'Orebar');
        this.mb.setOption('index', 'file://' + process.cwd() + '/' + f);
        this.mb.setOption('alwaysOnTop', this.topFrag);
        this.mb.setOption('showDockIcon', this.showDockIcon);
        this.mb.setOption('preloadWindow', true);
	this.mb.setOption('width',800);
	this.mb.setOption('height',600);
	this.mb.setOption('icon',process.cwd() + '/src/assets/menubaricon/icon.png');

	//	this.mb.window.transparent = true;

	this.mb.on('after-hide', () => { this.mb.app.hide() });
	//this.mb.on('after-create-window', () => { this.mb.window.loadURL('http://www.tumblr.com/dashboard'); });
    }
    
    get app() {
        return this.mb.app;
    }

    get browser_window() {
        return this.mb.window;
    }

    get tray() {
        return this.mb.tray;
    }

    get electon_positioner() {
        return this.mb.positioner;
    }

    public getOption(option: string): any {
        return this.mb.getOption(option);
    }

    public on_ready(x: execType): void {
        this.mb.on('ready', function ready() {
            x();
        });
    }



};