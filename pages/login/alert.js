function createAlert(title, summary, details, severity, dismissible, autoDismiss, appendToId) {
    var iconMap = {
        info: "fa fa-info-circle",
        success: "fa fa-thumbs-up",
        warning: "fa fa-exclamation-triangle",
        danger: "fa ffa fa-exclamation-circle"
    };

    var iconAdded = false;

    var alertClasses = ["alert", "animated", "flipInX"];
    alertClasses.push("alert-" + severity.toLowerCase());

    if (dismissible) {
        alertClasses.push("alert-dismissible");
    }

    var msgIcon = document.createElement("i");
    msgIcon.className = iconMap[severity];

    var msg = document.createElement("div");
    msg.className = alertClasses.join(" ");

    if (title) {
        var msgTitle = document.createElement("h4");
        msgTitle.innerHTML = title;
        msg.appendChild(msgTitle);
        
        if (!iconAdded) {
            msgTitle.prepend(msgIcon);
            iconAdded = true;
        }
    }

    if (summary) {
        var msgSummary = document.createElement("strong");
        msgSummary.innerHTML = summary;
        msg.appendChild(msgSummary);
        
        if (!iconAdded) {
            msgSummary.prepend(msgIcon);
            iconAdded = true;
        }
    }

    if (details) {
        var msgDetails = document.createElement("p");
        msgDetails.innerHTML = details;
        msg.appendChild(msgDetails);
        
        if (!iconAdded) {
            msgDetails.prepend(msgIcon);
            iconAdded = true;
        }
    }

    if (dismissible) {
        var msgClose = document.createElement("span");
        msgClose.className = "close";
        msgClose.dataset.dismiss = "alert";
        msgClose.innerHTML = "<i class='fa fa-times-circle'></i>";
        msg.appendChild(msgClose);
    }
    
    document.getElementById(appendToId).prepend(msg);
    
    if (autoDismiss) {
        setTimeout(function() {
            msg.classList.add("flipOutX");
            setTimeout(function() {
                msg.remove();
            }, 1000);
        }, 5000);
    }
}