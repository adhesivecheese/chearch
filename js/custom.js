async function load(url) {
	let obj = null;

	try {
		obj = await (await fetch(url)).json();
	} catch (e) {
		console.log('error');
	}
	return obj
}

function fetchMore(before) {
	getFromPS(form, before)
}

function jsonConverter(data, renderMD, highlight, searchTerm) {
	html = ""
	before = 2147483647
	data.forEach(obj => {
		display = true
		before = obj.created_utc
		timestamp = new Date(obj.created_utc * 1000)
		timestamp = timestamp.toString().split(" (")[0]
		thumbnail = ""
		if (obj.is_self == false) {
			text = obj.url
			link = obj.full_link
			title = obj.title
			if (obj.thumbnail != '' || obj.thumbnail != "nsfw") {
				thumbnail = obj.thumbnail
			}
		} else {
			if ("body" in obj) {
				text = obj.body
				link = "https://reddit.com" + obj.permalink
				title = "comment"
			} else if ("selftext" in obj) {
				text = obj.selftext
				link = obj.full_link
				title = obj.title
			}
		}

		if (renderMD.checked) {
				markUp = SnuOwnd.getParser().render(text)
		} else {
				markUp = text
				markUp = markUp.replaceAll("\n","<br>")
		}
		if (highlight.checked && searchTerm.length > 0) {
			if (!searchTerm.startsWith('"')) {
				searchArray = searchTerm.split(" ");
				
				searchArray.forEach(element => {
					var regex = new RegExp('\\b' + element + '\\b', "gi");
					markUp = markUp.replaceAll(regex,`<mark>${element}</mark>`)
			
				});
			} else {
				term = searchTerm.replaceAll('"',"")
				markUp = markUp.replaceAll(term,`<mark>${term}</mark>`)
			}
		}
			

			html += `
	<div class="card">
		<div class="card-content">
			<div class="content">
				<div class="field">
					<span><a href="https://reddit.com/r/${obj.subreddit}">/r/${obj.subreddit}</a></span> ● 
					<span><a href="reddit.com/user/${obj.author}">/u/${obj.author}</a></span>
					<span class="is-pulled-right">${timestamp}</span>
				</div>
			`
			if (thumbnail) {
				html += `
				<div class="flex">
					<img src=${thumbnail} style="height:100px;width:100px;margin-right:5px"></img>
					<div>
						<a href="${link}" class="reddit-title">${title}</a>
						<div>${markUp}</div>
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
	html += `<input type="submit" class="button is-danger is-fullwidth" value="Fetch More" onclick="fetchMore(${before})">`
	return html
}

function getFromPS(form, before=-1){
	if (form.elements['searchFor'].value == "submission") {
		psURL = "https://api.pushshift.io/reddit/submission/search?html_decode=True"
	} else {
		psURL = "https://api.pushshift.io/reddit/comment/search?html_decode=True"
	}
	if (form.elements['author'].value != '') {
		psURL += "&author=" + form.elements['author'].value
	}
	if (form.elements['subreddit'].value != '') {
		psURL += "&subreddit=" + form.elements['subreddit'].value
	}
	if (form.elements['score'].value != '') {
		psURL += "&score=" + form.elements['score'].value
	}
	if (form.elements['after'].value != '') {
		after = new Date(form.elements['after'].value).valueOf() / 1000
		psURL += "&after=" + after
	}
	if (before != -1) {
		psURL += "&before=" + before
	} else if (form.elements['before'].value != '') {
			before = new Date(form.elements['before'].value).valueOf() / 1000
			psURL += "&before=" + before
	}
	if (form.elements['query'].value != '') {

		psURL += "&q=" + encodeURIComponent(form.elements['query'].value)
	}
	if (form.elements['resultSize'].value == '') {
		psURL += "&size=100"
	} else {
		psURL += "&size=" + form.elements['resultSize'].value;
	}

	load(psURL).then(value => {

		html = jsonConverter(value.data, form.elements['renderMD'], form.elements['highlight'],form.elements['query'].value, psURL)
		document.getElementById("results").innerHTML += html;
		document.getElementById("apiInfo").innerHTML = Object.keys(value.data).length + ` Results - <a href='${psURL}'>Generated API URL</a>`
	})
}

const form = document.getElementById('searchForm');
form.addEventListener('submit', (event) => {
	// stop form submission
	event.preventDefault();
	getFromPS(form)



});
