package org.pedon.app;

import android.Manifest;
import android.content.ClipData;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Locale;
import java.util.regex.Pattern;

public final class MainActivity extends AppCompatActivity {
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String APP_URL = "https://" + APP_HOST + "/assets/index.html";
    private static final int REQUEST_LOCATION = 4101;
    private static final int REQUEST_FILE = 4102;
    private static final long MAX_EXPORT_BYTES = 32L * 1024L * 1024L;
    private static final Pattern SAFE_NAME = Pattern.compile("[A-Za-z0-9][A-Za-z0-9._-]{0,119}");

    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraOutputUri;
    private File cameraOutputFile;
    private GeolocationPermissions.Callback pendingGeoCallback;
    private String pendingGeoOrigin;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(APP_HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                WebResourceResponse local = assetLoader.shouldInterceptRequest(uri);
                if (local != null) return local;
                if (APP_HOST.equals(uri.getHost())) return blockedResponse(404, "Not Found");
                return blockedResponse(403, "Network access disabled");
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme()) && APP_HOST.equals(uri.getHost())) return false;
                if ("https".equalsIgnoreCase(uri.getScheme()) && request.hasGesture()) openExternal(uri);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                requestWebLocation(origin, callback);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // WebRTC/camera/microphone access is not used by this app. Photos go through Android's picker.
                request.deny();
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                return showFileChooser(callback, params);
            }
        });

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        setContentView(webView);
        webView.loadUrl(APP_URL);
    }

    private void openExternal(Uri uri) {
        try {
            Intent view = new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(Intent.createChooser(view, "Open link"));
        } catch (Exception e) {
            Toast.makeText(this, "No browser available", Toast.LENGTH_SHORT).show();
        }
    }

    private static WebResourceResponse blockedResponse(int code, String reason) {
        return new WebResourceResponse(
                "text/plain",
                "UTF-8",
                code,
                reason,
                Collections.emptyMap(),
                new ByteArrayInputStream(new byte[0])
        );
    }

    private void requestWebLocation(String origin, GeolocationPermissions.Callback callback) {
        if (!APP_HOST.equals(Uri.parse(origin).getHost())) {
            callback.invoke(origin, false, false);
            return;
        }
        boolean fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
        boolean coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
        if (fine || coarse) {
            callback.invoke(origin, true, false);
            return;
        }
        if (pendingGeoCallback != null) pendingGeoCallback.invoke(pendingGeoOrigin, false, false);
        pendingGeoCallback = callback;
        pendingGeoOrigin = origin;
        ActivityCompat.requestPermissions(this, new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
        }, REQUEST_LOCATION);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQUEST_LOCATION || pendingGeoCallback == null) return;
        boolean allowed = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
        pendingGeoCallback.invoke(pendingGeoOrigin, allowed, false);
        pendingGeoCallback = null;
        pendingGeoOrigin = null;
    }

    private boolean showFileChooser(ValueCallback<Uri[]> callback, WebChromeClient.FileChooserParams params) {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        fileCallback = callback;
        cameraOutputUri = null;
        cameraOutputFile = null;

        String mime = acceptedMime(params.getAcceptTypes());
        boolean image = mime.startsWith("image/");
        Intent open = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        open.addCategory(Intent.CATEGORY_OPENABLE);
        open.setType(mime);
        open.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE);
        Intent chooser = Intent.createChooser(open, image ? "Choose or capture a photo" : "Choose a file");

        if (image && params.isCaptureEnabled()) {
            Intent camera = cameraIntent();
            if (camera != null) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
        }
        try {
            startActivityForResult(chooser, REQUEST_FILE);
            return true;
        } catch (Exception e) {
            fileCallback = null;
            callback.onReceiveValue(null);
            deleteUnusedCameraFile();
            return false;
        }
    }

    private static String acceptedMime(String[] acceptTypes) {
        if (acceptTypes == null) return "*/*";
        for (String type : acceptTypes) {
            if (type == null) continue;
            String candidate = type.trim().toLowerCase(Locale.ROOT);
            if (candidate.startsWith("image/")) return "image/*";
            if ("application/json".equals(candidate)) return candidate;
            if ("text/csv".equals(candidate)) return candidate;
        }
        return "*/*";
    }

    private Intent cameraIntent() {
        try {
            File directory = new File(getCacheDir(), "camera");
            if (!directory.exists() && !directory.mkdirs()) return null;
            cameraOutputFile = File.createTempFile("pedon_", ".jpg", directory);
            cameraOutputUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", cameraOutputFile);
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            intent.putExtra(MediaStore.EXTRA_OUTPUT, cameraOutputUri);
            intent.setClipData(ClipData.newUri(getContentResolver(), "Pedon photo", cameraOutputUri));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            if (intent.resolveActivity(getPackageManager()) == null) {
                deleteUnusedCameraFile();
                return null;
            }
            return intent;
        } catch (Exception e) {
            deleteUnusedCameraFile();
            return null;
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_FILE || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            if (data != null && data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                result = new Uri[count];
                for (int i = 0; i < count; i++) result[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data != null && data.getData() != null) {
                result = new Uri[]{data.getData()};
            } else if (cameraOutputUri != null) {
                result = new Uri[]{cameraOutputUri};
            }
        }
        boolean usedCameraFile = result != null && cameraOutputUri != null
                && result.length == 1 && cameraOutputUri.equals(result[0]);
        ValueCallback<Uri[]> pending = fileCallback;
        fileCallback = null;
        pending.onReceiveValue(result);
        if (!usedCameraFile) deleteUnusedCameraFile();
        cameraOutputUri = null;
        cameraOutputFile = null;
    }

    private void deleteUnusedCameraFile() {
        if (cameraOutputFile != null && cameraOutputFile.exists()) {
            // Keep a successful capture; this method is used only when it was not selected or launch failed.
            cameraOutputFile.delete();
        }
        cameraOutputFile = null;
        cameraOutputUri = null;
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (pendingGeoCallback != null) pendingGeoCallback.invoke(pendingGeoOrigin, false, false);
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidBridge");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    public final class AndroidBridge {
        @JavascriptInterface
        public String saveFile(String filename, String base64Data) {
            if (filename == null || !SAFE_NAME.matcher(filename).matches() || filename.contains("..")
                    || base64Data == null || base64Data.length() > 48 * 1024 * 1024) return "error";
            Uri output = null;
            try {
                byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                if (bytes.length == 0 || bytes.length > MAX_EXPORT_BYTES) return "error";
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeFor(filename));
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Pedon");
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                output = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (output == null) return "error";
                try (OutputStream stream = getContentResolver().openOutputStream(output, "w")) {
                    if (stream == null) throw new IOException("Could not open Downloads output");
                    stream.write(bytes);
                    stream.flush();
                }
                ContentValues ready = new ContentValues();
                ready.put(MediaStore.MediaColumns.IS_PENDING, 0);
                getContentResolver().update(output, ready, null, null);
                return "saved";
            } catch (Exception e) {
                if (output != null) getContentResolver().delete(output, null, null);
                return "error";
            }
        }
    }

    private static String mimeFor(String filename) {
        String name = filename.toLowerCase(Locale.ROOT);
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (name.endsWith(".csv")) return "text/csv";
        if (name.endsWith(".geo.json")) return "application/geo+json";
        if (name.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }
}
