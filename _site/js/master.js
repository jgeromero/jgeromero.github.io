(function(){
  function addPermalinkToHeader(header) {
    if (header.id) {
      var permalink = document.createElement('a');
      permalink.href = '#' + header.id;
      permalink.innerHTML = '&sect;';
      header.appendChild(permalink);
      header.tabIndex = 0;
      permalink.onfocus = function() { this.style.display = 'block' };
      permalink.onblur = function() { this.style.display = '' };
    }
  }
  var headers = document.getElementsByTagName('h3');
  for (var i = headers.length; i--; ) {
    addPermalinkToHeader(headers[i]);
  }
  headers = document.getElementsByTagName('h4');
  for (var i = headers.length; i--; ) {
    addPermalinkToHeader(headers[i]);
  }
  headers = document.getElementsByTagName('h5');
  for (var i = headers.length; i--; ) {
    addPermalinkToHeader(headers[i]);
  }
})();

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-113152148-1', 'auto');
ga('send', 'pageview');

document.documentElement.onclick = function(e) {
  e = e || window.event;
  var target = e.target || e.srcElement;
  var clearAll;

  if (target.className.indexOf('topic') > -1) {

    // only add class if not clicking on the same one
    if (target.className.indexOf('selected') === -1) {
      clearAll = false;
    }
    else {
      clearAll = true;
    }

    var topicEls = [].slice.call(document.getElementsByClassName('topic'));
    for (var i = 0, len = topicEls.length; i < len; i++) {
      topicEls[i].className = topicEls[i].className.replace('selected', '');
    }

    if (!clearAll) {
      target.className += ' selected';
    }

    var tagName = target.getAttribute('data-name');
    var liEls = document.getElementsByClassName('posts')[0].getElementsByTagName('li');

    var numShown = 0;

    for (var i = 0, len = liEls.length; i < len; i++) {
      var content = liEls[i].getElementsByClassName('tags')[0].textContent;
      if (content.indexOf(tagName) > -1 || clearAll) {
        liEls[i].className = liEls[i].className.replace(/hidden/g, '');
        numShown++;
      }
      else {
        liEls[i].className += ' hidden';
      }
    }

    document.getElementById('shown').innerHTML = numShown;

    return false;
  }
};
