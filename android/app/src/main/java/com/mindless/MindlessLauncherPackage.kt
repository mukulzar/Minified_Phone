package com.mindless

import android.app.WallpaperManager
import android.graphics.Bitmap
import android.graphics.Color
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.ViewManager
import org.json.JSONArray

class MindlessLauncherPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(MindlessLauncherModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}

class MindlessLauncherModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val preferences = context.getSharedPreferences("mindless_setup", Context.MODE_PRIVATE)

  override fun getName(): String = "MindlessLauncher"

  @ReactMethod
  fun getSetupComplete(promise: Promise) {
    promise.resolve(preferences.getBoolean("setup_complete", false))
  }

  @ReactMethod
  fun completeSetup(promise: Promise) {
    preferences.edit().putBoolean("setup_complete", true).apply()
    promise.resolve(null)
  }

  @ReactMethod
  fun setBlackWallpaper(promise: Promise) {
    try {
      if (preferences.getBoolean("black_wallpaper_set", false)) {
        promise.resolve(null)
        return
      }
      val bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
      bitmap.eraseColor(Color.BLACK)
      try {
        WallpaperManager.getInstance(reactApplicationContext)
          .setBitmap(bitmap, null, true, WallpaperManager.FLAG_SYSTEM)
      } finally {
        bitmap.recycle()
      }
      preferences.edit().putBoolean("black_wallpaper_set", true).apply()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BLACK_WALLPAPER_FAILED", error)
    }
  }

  @ReactMethod
  fun getFavorites(promise: Promise) {
    try {
      if (!preferences.contains("favorites")) {
        promise.resolve(null)
        return
      }
      val storedFavorites = JSONArray(preferences.getString("favorites", "[]") ?: "[]")
      val result = WritableNativeArray()
      for (index in 0 until storedFavorites.length()) {
        result.pushString(storedFavorites.getString(index))
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("FAVORITES_READ_FAILED", error)
    }
  }

  @ReactMethod
  fun saveFavorites(favorites: ReadableArray, promise: Promise) {
    try {
      val storedFavorites = JSONArray()
      for (index in 0 until favorites.size()) {
        val favorite = favorites.getString(index)
        if (favorite != null) storedFavorites.put(favorite)
      }
      preferences.edit().putString("favorites", storedFavorites.toString()).apply()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("FAVORITES_SAVE_FAILED", error)
    }
  }

  @ReactMethod
  fun isDefaultHome(promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_MAIN)
        .addCategory(Intent.CATEGORY_HOME)
        .addCategory(Intent.CATEGORY_DEFAULT)
      val homePackage = reactApplicationContext.packageManager
        .resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
        ?.activityInfo
        ?.packageName
      promise.resolve(homePackage == reactApplicationContext.packageName)
    } catch (error: Exception) {
      promise.reject("DEFAULT_HOME_CHECK_FAILED", error)
    }
  }

  @ReactMethod
  fun openHomeSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_HOME_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("HOME_SETTINGS_FAILED", error)
    }
  }

  @ReactMethod
  fun getApps(promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val apps = reactApplicationContext.packageManager
        .queryIntentActivities(intent, PackageManager.MATCH_ALL)
        .filter { it.activityInfo.packageName != reactApplicationContext.packageName }
        .sortedBy { it.loadLabel(reactApplicationContext.packageManager).toString().lowercase() }
      val result = WritableNativeArray()
      apps.forEach { info ->
        val app = WritableNativeMap()
        app.putString("name", info.loadLabel(reactApplicationContext.packageManager).toString())
        app.putString("packageName", info.activityInfo.packageName)
        result.pushMap(app)
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject("APP_LIST_FAILED", error)
    }
  }

  @ReactMethod
  fun launchApp(packageName: String, promise: Promise) {
    try {
      val intent = reactApplicationContext.packageManager.getLaunchIntentForPackage(packageName)
        ?: throw IllegalArgumentException("App is not launchable")
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("APP_LAUNCH_FAILED", error)
    }
  }
}