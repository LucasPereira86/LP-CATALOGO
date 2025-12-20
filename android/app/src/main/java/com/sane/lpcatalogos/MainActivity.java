package com.sane.lpcatalogos;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Handle share intent on app creation
        handleShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        // Handle share intent when app is already running
        handleShareIntent(intent);
    }

    private void handleShareIntent(Intent intent) {
        String action = intent.getAction();
        String type = intent.getType();

        Log.d(TAG, "Received intent - Action: " + action + ", Type: " + type);

        if (Intent.ACTION_SEND.equals(action) && type != null) {
            if ("application/pdf".equals(type)) {
                handleSinglePdf(intent);
            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action) && type != null) {
            if ("application/pdf".equals(type)) {
                handleMultiplePdfs(intent);
            }
        }
    }

    private void handleSinglePdf(Intent intent) {
        Uri pdfUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (pdfUri != null) {
            Log.d(TAG, "Received PDF URI: " + pdfUri.toString());
            processPdfUri(pdfUri);
        }
    }

    private void handleMultiplePdfs(Intent intent) {
        java.util.ArrayList<Uri> pdfUris = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
        if (pdfUris != null) {
            for (Uri uri : pdfUris) {
                Log.d(TAG, "Received PDF URI: " + uri.toString());
                processPdfUri(uri);
            }
        }
    }

    private void processPdfUri(Uri uri) {
        try {
            // Get file name from URI
            String fileName = getFileNameFromUri(uri);

            // Read file contents
            InputStream inputStream = getContentResolver().openInputStream(uri);
            if (inputStream == null) {
                Log.e(TAG, "Could not open input stream for URI: " + uri);
                return;
            }

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            int nRead;
            byte[] data = new byte[16384];

            while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }

            buffer.flush();
            inputStream.close();

            byte[] fileBytes = buffer.toByteArray();
            String base64Data = Base64.encodeToString(fileBytes, Base64.NO_WRAP);

            Log.d(TAG, "PDF read successfully: " + fileName + " (" + fileBytes.length + " bytes)");

            // Send to JavaScript
            sendToJavaScript(fileName, base64Data, fileBytes.length);

        } catch (Exception e) {
            Log.e(TAG, "Error processing PDF: " + e.getMessage(), e);
        }
    }

    private String getFileNameFromUri(Uri uri) {
        String fileName = "shared_document.pdf";

        try {
            android.database.Cursor cursor = getContentResolver().query(uri, null, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                if (nameIndex >= 0) {
                    fileName = cursor.getString(nameIndex);
                }
                cursor.close();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting filename: " + e.getMessage());
        }

        return fileName;
    }

    private void sendToJavaScript(String fileName, String base64Data, int fileSize) {
        // Wait a bit for the WebView to be ready
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            try {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    // Escape the base64 data for JavaScript
                    String jsCode = String.format(
                            "if(window.handleReceivedPdf){window.handleReceivedPdf('%s','%s',%d);}else{console.log('handleReceivedPdf not ready, retrying...');setTimeout(function(){if(window.handleReceivedPdf){window.handleReceivedPdf('%s','%s',%d);}},1000);}",
                            escapeForJs(fileName), base64Data, fileSize,
                            escapeForJs(fileName), base64Data, fileSize);

                    webView.evaluateJavascript(jsCode, null);
                    Log.d(TAG, "Sent PDF data to JavaScript: " + fileName);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error sending to JavaScript: " + e.getMessage(), e);
            }
        }, 1500); // Wait 1.5 seconds for WebView to load
    }

    private String escapeForJs(String str) {
        return str.replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
