load('api_timer.js');
load('api_http.js');
load('api_config.js');
load('api_mqtt.js');
load('api_sys.js');
load('api_aws.js');

let NodeState = {
  activated: Cfg.get('app.activated'),
  nodeId: Cfg.get('app.nodeId'),
  ptoken: Cfg.get('app.ptoken'),
  pmac: Cfg.get('app.pmac'),
  pass: Cfg.get('wifi.sta.pass'),
  ssid: Cfg.get('wifi.sta.ssid'),
  nodeURL: Cfg.get('app.nodeURL'),
  nextDiag: Cfg.get('app.nextDiag'),
  state: Cfg.get('app.state')
};

let reqState = {
  cmdId: Cfg.get('app.reqId'),
  response: Cfg.get('app.resp'),
  reqStatus: Cfg.get('app.reqStatus'),
  request: Cfg.get('app.req')
};

if (NodeState.activated === 1) {
  if (NodeState.state === 0) {
    AWS.Shadow.setStateHandler(function (data, event, reported, desired, reported_metadata, desired_metadata) {
      if (event === AWS.Shadow.CONNECTED) {
        AWS.Shadow.update(0, NodeState);
      } else if (event === AWS.Shadow.UPDATE_DELTA) {
        for (let key in NodeState) {
          if (desired[key] !== undefined) NodeState[key] = desired[key];
        }
        Cfg.set({ app: { ptoken: NodeState.ptoken } });
        Cfg.set({ app: { pmac: NodeState.pmac } });
        Cfg.set({ app: { nodeId: NodeState.nodeId } });
        Cfg.set({ app: { nodeURL: NodeState.nodeURL } });
        Cfg.set({ wifi: { sta: { ssid: NodeState.ssid } } });
        Cfg.set({ wifi: { sta: { pass: NodeState.pass } } });
        Cfg.set({ app: { activated: NodeState.activated } });
        AWS.Shadow.update(0, NodeState);  // Report device state
        if (NodeState.activated === 0) {
          print('shadow');
          Sys.reboot(50);
        }
      }
    }, null);

    if (reqState.cmdId !== '') {
      Cfg.set({ app: { reqId: '' } });
      if (reqState.cmdId === 'diag') {
        let st = '';
        if (reqState.reqStatus === 1) {
          st = 'success';
        }
        else {
          st = 'failed';
        }
        let re = {
          nodeId: NodeState.nodeId,
          resp: reqState.response,
          statusp: st
        };
        MQTT.pub('Dignostic/influx', JSON.stringify(re), 1);
      }
      else {
        let st = '';
        if (reqState.reqStatus === 1) {
          st = 'success';
        }
        else {
          st = 'failed';
        }
        let re = {
          requestsp: reqState.request,
          resultsp: reqState.response,
          cmdId: reqState.cmdId,
          statusp: st
        };
        MQTT.pub('CmdResponse/influx', JSON.stringify(re), 1);
      }
    }

    MQTT.sub('cmd/' + NodeState.nodeId, function (conn, topic, msg) {
      let data = JSON.parse(msg);
      let req = data.request;
      NodeState.state = 1;
      AWS.Shadow.update(0, NodeState);
      print('cmd got');
      Cfg.set({ app: { reqId: data.cmdId } });
      Cfg.set({ app: { req: req } });
      Cfg.set({ app: { state: 1 } });
      Cfg.set({ mqtt: { enable: false } });
      Cfg.set({ wifi: { sta: { enable: true } } });
      Cfg.set({ pppos: { enable: false } });
      Cfg.set({ sntp: { enable: false } });
      Sys.reboot(500);
    }, null);

    //diagnostic cycle
    let currentTime = Math.floor(Timer.now());
    if (NodeState.nextDiag < currentTime) {
      let req = JSON.stringify({
        a: 'diag',
        token: Cfg.get('app.ptoken'),
        mac: Cfg.get('app.pmac')
      });

      NodeState.state = 1;
      AWS.Shadow.update(0, NodeState);
      print('nextDiag less');
      Cfg.set({ app: { nextDiag: currentTime + 3600 } });
      Cfg.set({ app: { reqId: 'diag' } });
      Cfg.set({ app: { req: req } });
      Cfg.set({ app: { state: 1 } });
      Cfg.set({ mqtt: { enable: false } });
      Cfg.set({ wifi: { sta: { enable: true } } });
      Cfg.set({ pppos: { enable: false } });
      Cfg.set({ sntp: { enable: false } });
      Sys.reboot(500);
    }
    else {
      let waitTime = NodeState.nextDiag - currentTime;
      Timer.set(waitTime * 1000, Timer.REPEAT, function () {
        let req = JSON.stringify({
          a: 'diag',
          token: Cfg.get('app.ptoken'),
          mac: Cfg.get('app.pmac')
        });
        NodeState.state = 1;
        AWS.Shadow.update(0, NodeState);
        print('nextDiag more');
        Cfg.set({ app: { nextDiag: NodeState.nextDiag + 3600 } });
        Cfg.set({ app: { reqId: 'diag' } });
        Cfg.set({ app: { req: req } });
        Cfg.set({ app: { state: 1 } });
        Cfg.set({ mqtt: { enable: false } });
        Cfg.set({ wifi: { sta: { enable: true } } });
        Cfg.set({ pppos: { enable: false } });
        Cfg.set({ sntp: { enable: false } });
        Sys.reboot(500);
      }, null);
    }

  }
  else {
    Sys.reboot(30000);
    Cfg.set({ app: { state: 0 } });
    Cfg.set({ mqtt: { enable: true } });
    Cfg.set({ wifi: { sta: { enable: false } } });
    Cfg.set({ pppos: { enable: true } });
    Cfg.set({ sntp: { enable: true } });
    Cfg.set({ app: { reqStatus: 0 } });
    Timer.set(5000, Timer.REPEAT, function () {
      let urlf = Cfg.get('app.nodeURl');
      let req = Cfg.get('app.req');
      let postdata = JSON.parse(req);
      HTTP.query({
        url: urlf,
        data: postdata,
        success: function (res) {
          print('network request done');
          print(res);
          Cfg.set({ app: { resp: res } });
          Cfg.set({ app: { reqStatus: 1 } });
          Sys.reboot(500);
        },
        error: function (err) {
          Cfg.set({ app: { resp: 'error' } });
          Cfg.set({ app: { reqStatus: 0 } });
          Sys.reboot(500);
        }
      });
    }, null);
  }
}
else {
  AWS.Shadow.setStateHandler(function (data, event, reported, desired, reported_metadata, desired_metadata) {
    if (event === AWS.Shadow.CONNECTED) {
      AWS.Shadow.update(0, NodeState);
    } else if (event === AWS.Shadow.UPDATE_DELTA) {
      for (let key in NodeState) {
        if (desired[key] !== undefined) NodeState[key] = desired[key];
      }
      Cfg.set({ app: { ptoken: NodeState.ptoken } });
      Cfg.set({ app: { pmac: NodeState.pmac } });
      Cfg.set({ app: { nodeId: NodeState.nodeId } });
      Cfg.set({ app: { nodeURL: NodeState.nodeURL } });
      Cfg.set({ wifi: { sta: { ssid: NodeState.ssid } } });
      Cfg.set({ wifi: { sta: { pass: NodeState.pass } } });
      Cfg.set({ app: { activated: NodeState.activated } });
      AWS.Shadow.update(0, NodeState);  // Report device state
      if (NodeState.activated === 1) {
        Sys.reboot(50);
      }
    }
  }, null);
}