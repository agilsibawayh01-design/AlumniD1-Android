plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "id.alkahfi.alumnid1"
    compileSdk = 35

    defaultConfig {
        applicationId = "id.alkahfi.alumnid1"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }
}

kotlin { jvmToolchain(17) }
