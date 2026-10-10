plugins {
    id("com.android.application")
}

configurations.configureEach {
    exclude(group = "org.jetbrains.kotlin", module = "kotlin-stdlib-jdk7")
    exclude(group = "org.jetbrains.kotlin", module = "kotlin-stdlib-jdk8")
}

android {
    namespace = "org.pedon.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "org.pedon.app"
        minSdk = 29
        targetSdk = 35
        versionCode = 7
        versionName = "2.0.2"
    }

    signingConfigs {
        create("release") {
            val keystorePath: String? = System.getenv("PEDON_KEYSTORE")
                ?: project.findProperty("pedon.keystore")?.toString()
            val keystoreFile = keystorePath?.let { file(it) }
            if (keystoreFile != null && keystoreFile.exists()) {
                storeFile = keystoreFile
                storePassword = System.getenv("PEDON_KEYSTORE_PASSWORD")
                    ?: project.findProperty("pedon.keystore.password")?.toString()
                keyAlias = System.getenv("PEDON_KEY_ALIAS")
                    ?: project.findProperty("pedon.key.alias")?.toString()
                keyPassword = System.getenv("PEDON_KEY_PASSWORD")
                    ?: project.findProperty("pedon.key.password")?.toString()
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
            isDebuggable = true
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            val release = signingConfigs.getByName("release")
            signingConfig = if (release.storeFile != null) release else signingConfigs.getByName("debug")
        }
    }

    applicationVariants.all {
        val variant = this
        variant.outputs.all {
            val output = this as com.android.build.gradle.internal.api.BaseVariantOutputImpl
            output.outputFileName = "Pedon-Studio-${defaultConfig.versionName}-${variant.buildType.name}.apk"
        }
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.8.0")
    implementation("androidx.core:core:1.16.0")
    implementation("androidx.webkit:webkit:1.17.1")
}
