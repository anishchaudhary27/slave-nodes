package com.example.slavenodeclient;

import android.app.ProgressDialog;
import android.os.AsyncTask;
import android.os.StrictMode;

import java.io.IOException;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class Satellite {
    private OkHttpClient httpClient;
    private String apiKey;
    private String GET_NODE_STATE = "getConnState";
    private String SEND_CMD = "sendCmd";
    private String GET_CMD_RESULT = "getCmdResult";
    private String REGISTER_DEVICE = "register";
    private String UNREGISTER_DEVICE = "unregister";
    private String endpoint;
    public Satellite(String apiKey,String endpoint) {
        this.httpClient = new OkHttpClient();
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()
                .permitAll().build();
        StrictMode.setThreadPolicy(policy);
        this.apiKey = apiKey;
        this.endpoint = endpoint;
    }

    private String getConnReq(String device) {
        return "{\"apiKey\":\""+this.apiKey+"\",\"deviceId\":\""+device+"\"}";
    }

    public String getNodeState(String device) throws IOException {
        return makeReq(GET_NODE_STATE,getConnReq(device));
    }

    private String getSendCmdReq(String nodeId,String request) {
        return "{\"apiKey\":\""+this.apiKey+"\",\"nodeId\":\""+nodeId+"\",\"request\":\""+request+"\"}";
    }

    public String sendNodeCmd(String nodeId,String request) throws IOException {
        return makeReq(SEND_CMD,getSendCmdReq(nodeId,request));
    }

    private String getCmdResultReq(String cmdId) {
        return "{\"apiKey\":\""+this.apiKey+"\",\"cmdId\":\""+cmdId+"\"}";
    }

    public String getCmdResult(String cmdId) throws IOException {
        return makeReq(GET_CMD_RESULT,getCmdResultReq(cmdId));
    }

    private String getRegisterationReq(String nodeId,String deviceId,String ssid,String pass,String token,String mac) {
        return "{\"apiKey\":\""+this.apiKey+"\",\"nodeId\":\""+nodeId+"\",\"deviceId\":\""+deviceId+"\"" +
                ",\"pmac\":\""+mac+"\",\"ptoken\":\""+token+"\",\"ssid\":\""+ssid+"\",\"pass\":\""+pass+"\"}";
    }

    public String registerNode(String nodeId,String deviceId,String ssid,String pass,String token,String mac) throws IOException {
        return makeReq(REGISTER_DEVICE,getRegisterationReq(nodeId,deviceId,ssid,pass,token,mac));
    }

    private String getUnregistrationReq(String device) {
        return "{\"apiKey\":\""+this.apiKey+"\",\"deviceId\":\""+device+"\"}";
    }

    public String unregisterNode(String deviceId) throws IOException {
        return makeReq(UNREGISTER_DEVICE,getUnregistrationReq(deviceId));
    }

    private String makeReq(String type,String json) throws IOException {

        RequestBody body = RequestBody.create(MediaType.parse("application/json; charset=utf-8"),json);
        Request request = new Request.Builder()
                .url(this.endpoint + type)
                .post(body)
                .build();

        Response response = this.httpClient.newCall(request).execute();

        if(response.isSuccessful()) {
            if(response.code() == 200) {
                return response.body().string();
            }
            else {
                return "error";
            }
        }
        else {
            return "error";
        }


    }


}
