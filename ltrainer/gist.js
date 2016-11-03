(function () {
    "use strict";

    window.Gist = window.Gist || {};

    window.Gist.getAuthorizationToken = function(username, password) {
        var dfd = new $.Deferred();

        $.ajax({ 
            url: 'https://api.github.com/authorizations',
            type: 'POST',
            beforeSend: function(xhr) { 
                xhr.setRequestHeader("Authorization", "Basic " + btoa(username+":"+password)); 
            },
            data: '{"scopes":["gist"],"note":"ajax gist test for a user"}'
        }).done(function(response) {
            dfd.resolve(response);
        });

        return dfd;
    };

    
})();