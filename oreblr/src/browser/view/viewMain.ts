import * as Viewmodule from './view';
import * as express from 'express';
import * as fs from 'fs';
import * as ExistFile from '../utility/isexist';
import * as http from 'http';
import * as tumblrCli from '../apps/tumblr/tmbrget';
import { Socket } from 'net';
import { menu } from '../../render/menu';
import { name } from '../../../package.json';
import opener = require('opener');

// console.log = () => {}

var tumblrData: tumblrCli.tumblrCli = undefined;
const CONSUMER_KEY: string = 'WJbL4DpsB167XaNdeCOQx3TWLsxKJreORvWXEYrBufByLODynM';
const CONSUMER_SECRET: string = 'FFNVTRT1xc0vuCr103mjHxkFs0qCnqYEaMUr67lVtf6nRhoRtg';
const TOKENS_FILE: string = 'tokens';

function getAccessToken(event: any) {
    let app: express.Application = express();
    let oauthRequestToken: string = undefined, oauthRequestTokenSecret: string = undefined;

    app.set('port', process.env.PORT || 3000);

    const oauth = require('oauth');
    let consumer: typeof oauth.OAuth = new oauth.OAuth(
        "http://www.tumblr.com/oauth/request_token",
        "http://www.tumblr.com/oauth/access_token",
        CONSUMER_KEY,
        CONSUMER_SECRET,
        "1.0A",
        "http://localhost:3000/auth/callback",
        "HMAC-SHA1"
    );

    app.get('/', (_: any, res: express.Response) => {
        consumer.getOAuthRequestToken((err: Error, oauthToken: string, oauthTokenSecret: string) => {
            if (err) {
                res.send("Error getting OAuth request token: " + err);
                return;
            } else {
                oauthRequestToken = oauthToken;
                oauthRequestTokenSecret = oauthTokenSecret;

                res.redirect("http://www.tumblr.com/oauth/authorize?oauth_token=" + oauthRequestToken);
            }
        });
    });

    const server = http.createServer(app).listen(app.get('port'), () => {
        console.log('Listening on port ' + app.get('port'));
        opener('http://localhost:3000');
    });
    server.on('connection', (sock: Socket) => { sock.unref() });


    app.get('/auth/callback', (req: express.Request, res: express.Response) => {
        consumer.getOAuthAccessToken(
            oauthRequestToken,
            oauthRequestTokenSecret,
            req.query.oauth_verifier,
	    (err: Error, AccessToken: string, AccessTokenSecret: string) => {
                if (err) {
                    res.send("Error getting OAuth access token: " + err);
                    return;
                } else {
                    const oauth: string[] = [
                        CONSUMER_KEY,
                        CONSUMER_SECRET,
                        AccessToken,
                        AccessTokenSecret
                    ];

                    fs.writeFile(__dirname + '/' + TOKENS_FILE, AccessToken + '\n' + AccessTokenSecret, (err: Error) => {
                        if (err) throw err;
                        console.log(name + ": Save complete");
                    });
                    res.sendFile(require('path').resolve(__dirname + '/../../render/docs/tumblrAS.html'));
                    const tumblr: tumblrCli.tumblrCli = new tumblrCli.tumblrCli(oauth);

		    tumblrData = tumblr;

		    tumblr.getDashboardLatest().then((result: any) => {
			event.sender.send('authorizeComplete', result, tumblr.readLimit);
			console.log(name + ': Authorize succeed');
		    }).catch((err: Error) => {
			console.log(err);
		    });
                }
            }
        );
    });
}

function login(event: any) {
    if (ExistFile.isExistFile(__dirname + '/' + TOKENS_FILE)) {
        console.log(name + ': Found AccessToken...');
        const splitToken: string[] = fs.readFileSync(__dirname + '/' + TOKENS_FILE).toString().split(/\r\n|\r|\n/);

        if (splitToken[0] != "" && splitToken[1] != "") {
            console.log(name + ': Authorize...');
            const tumblr:tumblrCli.tumblrCli = new tumblrCli.tumblrCli([CONSUMER_KEY, CONSUMER_SECRET, splitToken[0], splitToken[1]]);
            tumblrData = tumblr;

	    tumblr.getDashboardLatest().then((result: any) => {
		event.sender.send('authorizeComplete', result, tumblr.readLimit);
		console.log(name + ': Authorize succeed');
	    }).catch((err: Error) => {
		console.log(err);
	    });
        } else {
            console.log(name + ': ill-formed, getting access token...');
            getAccessToken(event);
        }
    } else {
        console.log(name + ': Not Found AccessToken, create new access token...');
        getAccessToken(event);
    }
}

function loadOtherItem(Item: string, view: Viewmodule.Page, event: any) {
    if (view.nowOpenItem !== Item) {

	if(Item === menu[0]) {

	    tumblrData.getDashboardLatest().then((data: any) => {
		event.sender.send(Item, data, tumblrData.readLimit);
		view.nowOpenItem = Item;
		console.log(name + ': ipc: sended => ' + menu[0]);
	    }).catch((err: Error) => {
		console.log(err);
	    });

	} else if (Item === menu[1]) {
	    
	    tumblrData.getLikes().then((data: any) => {
		event.sender.send(Item, data, tumblrData.readLimit);
		view.nowOpenItem = Item;
		console.log(name + ': ipc: sended => ' + menu[1]);
	    }).catch((err: Error) => {
		console.log(err);
	    });

	} else if (Item === menu[2]) {
	
	    tumblrData.getFollowing().then((data: any) => {
		event.sender.send(Item, data, tumblrData.readLimit);
		view.nowOpenItem = Item;
		console.log(name + ': ipc: sended => ' + menu[2]);
	    }).catch((err: Error) => {
		console.log(err);
	    });

	} else if (Item === menu[3]) {
	    // MyBlogs
	} else if (Item === menu[4]) {
	    // Popular
	} else if (Item === menu[5]) {
	    // Settings
	} else if (Item === menu[6]) {
	    // About
	} else {
	    
	}
    }
};

export function browser_main() {
    var view = new Viewmodule.Page(__dirname + '/../../render/docs/dash.html');

    view.ipcMain.on('tumblrAuthorization', login);
    
    view.mb.on('ready', () => {
        console.log(name + ': Ready');
    });

    view.ipcMain.on('clicked_quit', () => {
        console.log(name + ': Bye!');
        view.mb.app.quit();
    });

    view.ipcMain.on('clicked_info', (event: any) => {
	event.sender.send('disp_info');
	console.log(name + ': ipc: sended => disp_info');
    });
	    
    view.ipcMain.on('clicked_reload', (event: any) => {
	tumblrData.getDashboardLatest().then((data: any) => {
	    event.sender.send('reloaded_data', view.nowOpenItem, data, tumblrData.readLimit);
	    console.log(name + ': ipc: sended => reloaded_data');
	}).catch((err: Error) => {
	    console.log(err);
	});
    });

    for(let item of menu){
	view.ipcMain.on(item, (event: any) => {
	    loadOtherItem(item, view, event);
	});
    }
}
