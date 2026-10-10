# Pedon Studio ProGuard / R8 rules

# The WebView calls AndroidBridge.saveFile by name; keep every @JavascriptInterface method.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# Suppress warnings from WebView internals
-dontwarn android.webkit.**
-dontwarn org.chromium.**
