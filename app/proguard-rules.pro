# Pedon Studio ProGuard Rules
# WebView-based app; keep WebView interfaces and reflection targets

# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep MainActivity (exported launcher)
-keep class org.pedon.app.MainActivity { *; }

# Keep AndroidX classes
-keep class androidx.** { *; }

# Keep org.pedon.app namespace (assets loaded via reflection)
-keep class org.pedon.app.** { *; }

# Suppress warnings from WebView internals
-dontwarn android.webkit.**
-dontwarn org.chromium.**

# Keep serializable/parcelable classes
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Asset loading (WebView loads from file system, not reflection)
# No additional rules needed
