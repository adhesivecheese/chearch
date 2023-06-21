document.addEventListener('DOMContentLoaded', function() {
    loadParams()
}, false);

function clearAccessToken() {
	if (localStorage.getItem("access_token")) {
		document.getElementById("access_token").value = localStorage.getItem("access_token");
		form.elements['access_token'].value = ''
	}
}

function loadParams() {
	const urlParams = new URLSearchParams(window.location.search).entries();
	for(const param of urlParams) {
		try{
			if (param[0] == "until" || param[0] == "since") {
				value = new Date(param[1]*1000)
				offset = new Date().getTimezoneOffset()*60000
				value = new Date(value - offset).toISOString().slice(0,-1)
			} else {
				value = param[1]
			}
			document.getElementById(param[0]).value = value
		}
		catch {
			console.log("something went wrong")
		}
	}
	clearAccessToken()
}

async function load(url, access_token) {
	let obj = null;
	try {
		obj = await (await fetch(url, { headers: { "Authorization": `Bearer ${access_token}` } })).json();
	} catch (e) {
		console.log(e);
	}
	return obj
}

function fetchMore(until) {
	getFromPS(form, until)
}

function jsonConverter(data, renderMD, showthumbnails) {
	count = 0
	html = ""
	until = 2147483647
	data.forEach(obj => {
		count += 1
		display = true
		until = obj.created_utc
		timestamp = new Date(obj.created_utc * 1000)
		timestamp = timestamp.toString().split(" (")[0]
		thumbnail = ""
		if (obj.is_self == false) {
			text = obj.url
			link = "https://reddit.com" + obj.permalink
			title = obj.title
			if (showthumbnails.checked) {
				if (obj.thumbnail.endsWith(".jpg")) {
					thumbnail = obj.thumbnail
				}
			}
		} else {
			if ("body" in obj) {
				text = obj.body
				if (obj.permalink) {
					link = "https://reddit.com" + obj.permalink
				} else {
					link = `https://reddit.com//comments/${obj.link_id.replace("t3_","")}/-/${obj.id}`  
				}
				title = "comment"
			} else if ("selftext" in obj) {
				text = obj.selftext
				link = obj.url
				title = obj.title
			}
		}

		if (renderMD.checked) {
				markUp = SnuOwnd.getParser().render(text)
		} else {
				markUp = text
				markUp = markUp.replaceAll("\n","<br>")
		}
			html += `
	<div class="card">
		<div class="card-content">
			<div class="content">
				<div class="field">
					<span><a href="https://reddit.com/r/${obj.subreddit}">/r/${obj.subreddit}</a></span> ● 
					<span><a href="https://reddit.com/user/${obj.author}">/u/${obj.author}</a></span>
					<span class="is-pulled-right">${timestamp}</span>
				</div>
			`
			if (thumbnail) {
				html += `
				<div class="flex">
					<img src=${thumbnail} style="height:100px;width:100px;margin-right:5px"></img>
					<div>
						<a href="${link}" class="reddit-title">${title}</a>
						<div class="markdown">${markUp}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
			`
			} else {
				html += `
				<div>
					<a href="${link}" class="reddit-title">${title}</a>
					<div class="markdown">${markUp}</div>
				</div>
			</div>
		</div>
	</div>
			`
			}
	});
	if (count > 0){	html += `<input type="submit" class="button is-danger is-fullwidth" value="Fetch More" id="fetch-${until}" onclick="fetchMore(${until})">`}
	return html
}

function getFromPS(form, until=-1){
	button = document.getElementById("searchButton")
	button.value = "Searching..."
	if (until == -1){ document.getElementById("results").innerHTML="" }
	else {
		moreButton = document.getElementById("fetch-"+until)
		moreButton.value = "Fetching..."
	}
	path = "?"
	if (form.elements['kind'].value == "submission") {
		psURL = "https://api.pushshift.io/reddit/submission/search?html_decode=True"
		path += "kind=submission"
	} else {
		psURL = "https://api.pushshift.io/reddit/comment/search?html_decode=True"
		path += "kind=comment"
	}
	if (form.elements['author'].value != '') {
		psURL += "&author=" + form.elements['author'].value
		path  += "&author=" + form.elements['author'].value
	}
	if (form.elements['subreddit'].value != '') {
		psURL += "&subreddit=" + form.elements['subreddit'].value
		path  += "&subreddit=" + form.elements['subreddit'].value
	}

	if (form.elements['min_score'].value != '') {
		psURL += "&min_score=" + form.elements['min_score'].value
		path  += "&min_score=" + form.elements['min_score'].value
	}
	if (form.elements['max_score'].value != '') {
		psURL += "&max_score=" + form.elements['max_score'].value
		path  += "&max_score=" + form.elements['max_score'].value
	}
	if (form.elements['since'].value != '') {
		since = new Date(form.elements['since'].value).valueOf() / 1000
		psURL += "&since=" + since
		path  += "&since=" + since
	}
	if (until != -1) {
		psURL += "&until=" + until
	} else if (form.elements['until'].value != '') {
			until = new Date(form.elements['until'].value).valueOf() / 1000
			psURL += "&until=" + until
			path += "&until=" + until
	}
	if (form.elements['q'].value != '') {
		psURL += "&q=" + encodeURIComponent(form.elements['q'].value)
		path  += "&q=" + encodeURIComponent(form.elements['q'].value)
	}
	if (form.elements['size'].value == '') {
		psURL += "&size=100"
		path  += "&size=100"
	} else {
		psURL += "&size=" + form.elements['size'].value;
		path  += "&size=" + form.elements['size'].value;
	}
	history.pushState(Date.now(), "Chearch - Results", path)
	access_token = form.elements['access_token'].value
	localStorage.setItem("access_token", access_token);
	load(psURL, access_token).then(value => {
		try {
			html = jsonConverter(value.data, form.elements['renderMD'], form.elements['thumbnails'])
			document.getElementById("results").innerHTML += html;

			searchTerm = form.elements['q'].value
			if (highlight.checked && searchTerm.length > 0) {
				var instance = new Mark(document.querySelector("#results"));
				if (!searchTerm.startsWith('"')) {
					searchArray = searchTerm.split(" ");
					instance.mark(searchArray, {
						"wildcards": "enabled",
						"accuracy": "complementary"
					});
				} else {
					term = searchTerm.replaceAll('"',"")
					instance.mark(term, {
						"accuracy": "partially",
						"separateWordSearch": false
					});
				}
			}


			document.getElementById("apiInfo").innerHTML = Object.keys(value.data).length + ` Results - <a href='${psURL}'>Generated API URL</a>`
			button.value = "Search"
			try { document.getElementById("fetch-"+until).remove() }
			catch {}

			var list = document.querySelectorAll(".markdown a");
			for (let item of list) {
					link = item.href;
					if (link.endsWith(".jpg") || link.endsWith(".png") || link.endsWith(".gif")) {
							var node = document.createElement("button");
							node.setAttribute("onclick", "directExpand('" + link + "')")
							node.classList.add("button","is-danger","is-small")
							var textnode = document.createTextNode("+");
							node.appendChild(textnode);
							item.after(node);
					}
			}

		}
		catch {
			if (value.detail == "Invalid token or expired token.") {
				clearAccessToken()
				document.getElementById("apiInfo").innerHTML = `Invalid or expired token - <a href="https://api.pushshift.io/login?redirect=search-tool">Request new token</a> - <a href='${psURL}'>Generated API URL</a>`;
			} else {
	 			document.getElementById("apiInfo").innerHTML = `Search error. Pushshift may be down - <a href='${psURL}'>Generated API URL</a>`;
			}
			button.value = "Search";
		}
	})
}

function directExpand(link) {
	var img = document.createElement('img');
	img.src = link;
	els = document.querySelector("a[href='" + link + "']");
	els = els.nextElementSibling;
	els.innerHTML = '-'
	if (!els.nextElementSibling || els.nextElementSibling.id != link) {
	  node = document.createElement("div")
	  node.id = link;
	  els.after(node)
	}
	iels = els.nextElementSibling;
	if (!iels.hasChildNodes()) {
	  iels.appendChild(img);
	} else {
	  if (iels.style.display == 'none') {
		els.innerHTML = '-';
		iels.style.display = 'block'
	  } else {
		els.innerHTML = '+';
		iels.style.display = 'none';
	  }
	}
  }

const form = document.getElementById('searchForm');
form.addEventListener('submit', (event) => {
	event.preventDefault();
	getFromPS(form)
});
