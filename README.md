# Score Saber Extension
The chrome extension that modify UI of scoresaber.com.
It works with Chromium browsers (e.g. Google Chrome, Microsoft Edge).

## Install
You can install it from [Google Web Store](https://chrome.google.com/webstore/detail/score-saber-extension/hngcbgpmfminpejjechbpgjklecgmjao).

## Features
- Replace the links to rankings with the appropriate user ranks instead of the top rank.
- In the Player page...
  - able to expand ranking chart.
  - add star-ranks to each songs.
  - add accuracy rank (e.g. SS, S, A, B...) to each scores.
  - remember your account and add a link to it in the top bar.
- Add the OneClick Download buttons (require ModAssistant).
- Manage the shortcuts of your favorite players.
- Collect your favorite songs as "bookmarks" and can download as playlist file.
- Switch between searching for Players and searching for Songs/Authors in the search bar.

## Screenshots
![image](https://user-images.githubusercontent.com/15604618/121879998-750c1e80-cd48-11eb-9323-b09e3ee603d1.png)
- Difficulty levels is highlighted and star rank added(ranked map only).
- Links to the ranking of each song will take you to appropriate rank instead of top rank.
- By clicking on the mapper's name (below the song title), you can search for the maps designed by that mapper.
- Accuracy Ranks (e.g. SS, S, A...) are shown. (only valid songs)
- Added OneClick Install (require ModAssistant) and bookmark button.
- The line you mouse over will be highlighted.
----
You can see the bookmarked maps in the pop-up menu.

![image](https://user-images.githubusercontent.com/15604618/121882586-b5b96700-cd4b-11eb-9322-d1fae2c1bc52.png)

You can download a playlist containing the listed songs.

----
![image](https://user-images.githubusercontent.com/15604618/121883388-a5ee5280-cd4c-11eb-9244-b49d4a074f59.png)

Click on the icon to the left of the search field, you can switch between player search or song/author search.

## Development
To build, run `npm install` and `npm run build`.<br>
`/dist/` directory will be genarated, which will be the root of the extension. (In addition, `/icons/` will be needed.)