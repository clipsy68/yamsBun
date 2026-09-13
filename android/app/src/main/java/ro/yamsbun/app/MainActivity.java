package ro.yamsbun.app;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        splashScreen.setOnExitAnimationListener(splashScreenView -> {
            View icon = splashScreenView.getIconView();
            ObjectAnimator scaleX = ObjectAnimator.ofFloat(icon, View.SCALE_X, 1f, 1.2f);
            ObjectAnimator scaleY = ObjectAnimator.ofFloat(icon, View.SCALE_Y, 1f, 1.2f);
            scaleX.setDuration(300);
            scaleY.setDuration(300);

            ObjectAnimator fadeOut = ObjectAnimator.ofFloat(splashScreenView.getView(), View.ALPHA, 1f, 0f);
            fadeOut.setStartDelay(150);
            fadeOut.setDuration(300);
            fadeOut.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    splashScreenView.remove();
                }
            });

            scaleX.start();
            scaleY.start();
            fadeOut.start();
        });

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WebView webView = getBridge().getWebView();
        // The WebView's HTTP disk cache has been observed to persist across uninstalls on some
        // devices, serving stale bundled assets under the shared https://localhost origin. All
        // assets are already bundled locally, so caching them buys nothing; clear defensively.
        webView.clearCache(true);
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) view.getLayoutParams();
            params.topMargin = systemBars.top;
            params.bottomMargin = systemBars.bottom;
            params.leftMargin = systemBars.left;
            params.rightMargin = systemBars.right;
            view.setLayoutParams(params);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(webView);
    }
}
