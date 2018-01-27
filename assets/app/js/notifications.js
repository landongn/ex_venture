import Logger from "./logger"

let visible = true;

window.addEventListener("focus", () => {
  visible = true;
});
window.addEventListener("blur", () => {
  visible = false;
});

class Notifications {
  enable(callback) {
    if (!("Notification" in window)) {
      Logger.log("Cannot do notifications");
    }
    else if (Notification.permission === "granted") {
      Logger.log("We are already enabled");
      callback();
    }
    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(callback);
    }
  }

  display(title, body) {
    if (document.visibilityState == "visible" && visible) { return }

    this.enable(() => {
      new Notification(title, {body: body});
    });
  }
}

export default Notifications;
