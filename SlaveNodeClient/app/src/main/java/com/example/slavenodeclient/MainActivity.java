package com.example.slavenodeclient;

import androidx.appcompat.app.AppCompatActivity;

import android.app.ProgressDialog;
import android.os.AsyncTask;
import android.os.Bundle;
import android.widget.Toast;

import java.io.IOException;

public class MainActivity extends AppCompatActivity {
    ProgressDialog p;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        p = new ProgressDialog(this);
        SendCommand sendCommand = new SendCommand();
        sendCommand.execute("ajkdsb","bkabsjk");
    }

    private class SendCommand extends AsyncTask<String, String, String> {
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
            p.setMessage("Please wait...Executing command");
            p.setIndeterminate(false);
            p.setCancelable(false);
            p.show();
        }

        @Override
        protected String doInBackground(String... strings) {
            Satellite satellite = new Satellite("YlStZP8jNQd69IWXd5kE7M3dyqI3",
                    "https://q4bgyjzib8.execute-api.ap-south-1.amazonaws.com/Prod/");
            try {
                String result =  satellite.sendNodeCmd(strings[0],strings[1]);
                if(result == "error")
                    return "error executing command!!";
                else {
                    return result;
                }
            } catch (IOException e) {
                return "error executing command!!";
            }
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);
            if (s != null) {
                p.hide();
                Toast.makeText(MainActivity.this, s, Toast.LENGTH_SHORT).show();
            } else {
                p.show();
            }
        }


    }


}