/*
I needed to switch to background scripts. But chrome manifest v3 removed support for background scripts.
Service workers are used now, which also can't use XMLHttpRequest. So this class is unusable. I want to keep it for future use though.

class nethandler {
    get(url, data, options) {
        return new Promise((resolve, reject) => { 
            var XHR = new XMLHttpRequest();
            XHR.addEventListener("load", function(event) {
                resolve(event);
                XHR = null;
            });
            XHR.addEventListener("abort", function(event) {
                reject(event);
                XHR = null;
            });
            XHR.addEventListener("error", function(event) {
                reject(event);
                XHR = null;
            });
            XHR.open("get", url);
            XHR.send();
        });
    }
}
const neth = new nethandler();
*/

var appIndex = {
}
class netHandler {
    constructor() {

    }
    async get(url, data, options={}) {
        var fetchOptions = options;
        fetchOptions.method = "GET";
        if (data) {
            fetchOptions.data = options.data;
        }
        var response = await fetch(url, fetchOptions);
        return(response);
    }
    async post(url, data, options={}) {
        var fetchOptions = options;
        fetchOptions.method = "POST";
        if (data) {
            fetchOptions.data = options.data;
        }
        var response = await fetch(url, fetchOptions);
        return(response);
    }
}
var neth = null;
//Doing this to try to save resources. I am trying to wait until user wants to use the app to initialize my classes, to save as much computing power for other processes.

class vpnApp {
    constructor(promise) {
        this.proyList = {};
        //Fetch a few servers so the user doesn't have to wait a long time to see a list.
        neth.get("https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&ssl=all&anonymity=elite,anonymous").then(response => {
            response.text().then(proxyList => {
                proxyList = proxyList.split("\n");
                proxyList.forEach(proxy => {
                    proxy=proxy.split(":");
                    console.log(`proxy=${proxy[0]}&port=${proxy[1]}&type=socks5`);
                    neth.post("https://catchproxy.com/geo", `proxy=${proxy[0]}&port=${proxy[1]}&type=socks5`, {"mode":"no-cors", "headers":{"Content-Type": "application/x-www-form-urlencoded"}}).then(res => {
                        res.text().then(checkedProxy => {
                        console.log(checkedProxy);
                            //promise[0]();
                        })
                
                        res.json().then(checkedProxy => {
                            console.log(checkedProxy);
                            //promise[0]();
                        
                        })
                    });
                });
            })
        });
    }
    connect(data, promise) {
        var proxyList = this.proxyList;
        function setProxy(ip, port) {
            var bypassList = [];
            chrome.storage.local.get(["bypassList"]).then((result) => {
                if (result.bypassList) {
                    bypassList = result.bypassList;
                }
            })
            var proxyConf = {
                "mode": "fixed_servers",
                "rules": {
                    "singleProxy": {
                        "scheme": "socks5",
                        "host": ip,
                        "port": port
                    },
                    "bypassList": bypassList
                }
            }
            chrome.proxy.settings.set({"value": proxyConf, "scope": "regular"}, function(result) {
                console.log(result);
                promise[0]();
            });
            promise[0]("Connected");
        }
        if (data.proxyId) {
            if (this.proyList[data.proxyId]) {
                
            } else {promise[1]({err:true,info:"Proxy not found."})};
        } else {
            setProxy(proxyList[0].ip, proxyList[0].port);
        }
    }
    disconnect(data, promise) {
        var proxyConf = {
            "mode": "direct"
        }
        chrome.proxy.settings.set({"value": proxyConf, "scope": "regular"}, function() {

        });

    }
}
function initApp(app, promise) {
    switch(app) {
        case "vpn":
            if (appIndex["vpn"]) {promise[1](); return};
            if (neth == null) {
                neth = new netHandler();
            }
            appIndex["vpn"] = new vpnApp(promise);
            break;
        default:
            return;
    }
}
chrome.runtime.onMessage.addListener(function(message, sender, resolveM) { 
    switch(message.command) {
        case "initApp":
            var appPromise = function() {
                return new Promise((resolve, reject) => {
                    initApp(message.data, [resolve, reject]); 
                });
            }
            appPromise().then(function(response) {
                resolveM(response);
            }).catch(error => {
                if (error.err) {
                    resolveM({error:true,info:error.err.info});
                }
            })
            break;
        case "vpnConnect":
            var connectPromise = function() {
                return new Promise((resolve, reject) => {
                    if (appIndex["vpn"]) {
                        appIndex["vpn"].connect(message.data, [resolve, reject]);
                    } else {
                        reject({err:true,info:"VPN App not initialized."})
                    }
                });
            }
            connectPromise().then(function(response) {
                resolveM(response);
            }).catch(error => {
                if (error.err) {
                    resolveM({error:true,info:error.err.info});
                }
            })
            break;
    }
})