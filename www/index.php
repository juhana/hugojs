<!doctype HTML>
<html lang="en">
<head>
    <title>HugoJS – Hugo Online Interpreter</title>
    <meta charset="UTF-8">
    <meta name="description" content="Play Hugo interactive fiction online with the HugoJS interpreter">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
    <link rel="stylesheet" href="gallery.css">

    <script src="https://code.jquery.com/jquery-3.1.1.slim.min.js" integrity="sha256-/SIrNqv8h6QGKDuNoLGA4iret+kyesCkHGzVUUV0shc=" crossorigin="anonymous"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
</head>
<body>
<div class="container">
    <h1>HugoJS – Play Hugo games online</h1>

    <noscript>
        <div class="alert alert-danger">
            You need to enable JavaScript to play.
        </div>
    </noscript>

    <ul class="nav nav-tabs">
        <li role="presentation" class="active">
            <a href="#gallery" aria-controls="gallery" role="tab" data-toggle="tab">
                Gallery
            </a>
        </li>
        <li role="presentation">
            <a href="#link" aria-controls="link" role="tab" data-toggle="tab">
                Link
            </a>
        </li>
    </ul>

    <div class="tab-content">
        <div id="gallery" role="tabpanel" class="tab-pane active">
            <div class="list-group">

<?php
    $games = array(
        array(
            "title" => "Baby Uncle New Year",
            "author" => "Jonathan Blask",
            "file" => "buny",
            "info" => "A game written for the Even Newer New Year's Speed IF. It is not recommended for young audiences.",
            "ifdb" => "205oiovp1foyz46l"
        ),
        array(
            "title" => "Cryptozookeeper",
            "author" => "Robb Sherwin",
            "file" => "czk",
            "info" => "Marrow is delicious but that's not why you're here. You're supposed to pick up a single jar of alien bone jelly, which of course can't exist and doesn't exist, so you've convinced yourself that transporting it is no crime.",
            "ifdb" => "6xbqnmlxvkju2n04"
        ),
        array(
            "title" => "Guilty Bastards",
            "author" => "Kent Tessman",
            "file" => "guilty",
            "info" => "\"Go back to sleep,\" you tell yourself.  That's solid advice.  But when's the last time you listened to solid advice, particularly your own?  \"Things will look better in the morning.\"  Except it is the morning, and things don't look exceptionally better.",
            "ifdb" => "g02gj35cieg77y62"
        ),
        array(
            "title" => "Pantomime",
            "author" => "Robb Sherwin",
            "file" => "pmime",
            "info" => "Nothing evacuates a moon colony faster than news escaping that it's going to break up into a planetary ring within months. Poor Phobos. I was always fond of Phobos.",
            "ifdb" => "x1qqstrlsa9ocr0j"
        ),
        array(
            "title" => "Renga in Four Parts",
            "author" => "Jason Dyer",
            "file" => "renga",
            "info" => "This is interactive poetry: you can type particular words that occur in the text, or words that are implied. You can be entirely experiential and use word-association. Keep in mind that what you type is much a part of the poem as the verse.",
            "ifdb" => "fxdvtfimtdlq9tsu"
        ),
        array(
            "title" => "Spur",
            "author" => "Kent Tessman",
            "file" => "spur",
            "info" => "In retrospect, maybe all that cheap whiskey last night in Grady's wasn't such a brilliant idea.",
            "ifdb" => "2grzxvuvyoqgwwf1"
        ),
        array(
            "title" => "Storm Over London",
            "author" => "Juhana Leinonen",
            "file" => "storm",
            "info" => "A stormy night. An old mansion. And the woman keeps calling me Elizabeth.",
            "ifdb" => "bwm5l6dqe3inefds"
        ),
        array(
            "title" => "Tales of a Clockwork Boy",
            "author" => "Taleslinger",
            "file" => "clockworkboy",
            "info" => "Once upon a time, there was a queen of fay blood who couldn’t bear children. To humor her saddened king, she learnt the secret arts of alchemy and mechanicks, and her head bore what her womb would not. But even that clockwork boy, a wonder held in awe throughout the kingdom, couldn’t lift the king's spirits, and he fell into a great sadness.",
            "ifdb" => "uoyqgvkalgnhzs1n"
        ),
        array(
            "title" => "Tales of the Traveling Swordsman",
            "author" => "Mike Snyder",
            "file" => "tales_ts",
            "info" => "You are the traveling swordsman; the strong and silent stranger; the wandering vanquisher of villainy. Damsels swoon for you. Good men respect and envy you. Scoundrels learn to fear you. Even so, you are but a rumor throughout the land.",
            "ifdb" => "fsujzka1ua0h5att"
        )
    );

    for( $i = 0; $i < count( $games ); ++$i ) {
        $playUrl = "play/?story=library/".$games[$i]["file"].".hex";
?>
        <div class="list-group-item">
            <div class="row">
                <div class="col-sm-8">
                    <h3>
                        <a href="<?php echo $playUrl; ?>">
                            <?php echo $games[$i]["title"]; ?>
                        </a>
                        <small>by <?php echo $games[$i]["author"]; ?></small>
                    </h3>

                    <p>
                        <?php echo $games[$i]["info"]; ?>
                    </p>

                </div>

                <div class="col-sm-4 text-right">
                    <div class="btn-group action-buttons">
                        <a class="btn btn-primary" href="<?php echo $playUrl; ?>">
                            <span class="glyphicon glyphicon-play"></span>
                            Play now
                        </a>

                        <a class="btn btn-default" href="http://ifdb.tads.org/viewgame?id=<?php echo $games[$i]["ifdb"]; ?>">
                            <span class="glyphicon glyphicon-info-sign"></span>
                             IFDB
                        </a>
                    </div>
                </div>
            </div>
        </div>
<?php
}
?>
            </div>
        </div>
        <div id="link" role="tabpanel" class="tab-pane">
            <p>
                Enter the URL address of a .hex file into the field below
                and press Play to start.
            </p>
            <form action="play" method="get">
                <div class="form-group">
                    <label for="storyUrl">
                        URL
                    </label>
                    <input type="text" id="storyUrl" name="story" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary">
                    <span class="glyphicon glyphicon-play"></span>
                    Play
                </button>
            </form>
        </div>
    </div>
</div>
</body>
</html>
