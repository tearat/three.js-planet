<?php

if( $_GET["action"] == "load" )
{
    $mysql = mysqli_connect('localhost', 'root', '', 'planet') or die('Database connection error');
    $sql = "SELECT * FROM geos";
    $result = mysqli_query($mysql, $sql);
    while ($row = mysqli_fetch_assoc($result))
    {
        $data[] = $row;
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

if( $_GET["action"] == "add" )
{
    $title = $_POST["title"];
    $asimuth = $_POST["asimuth"];
    $polar = $_POST["polar"];
    $mysql = mysqli_connect('localhost', 'root', '', 'planet') or die('Database connection error');
    $sql = "INSERT INTO geos (title, asimuth, polar) VALUES ('$title', '$asimuth', '$polar')";
    $result = mysqli_query($mysql, $sql);
    $sql = "SELECT * FROM geos ORDER BY ID DESC LIMIT 1";
    $result = mysqli_query($mysql, $sql);
    $dot = mysqli_fetch_assoc($result);
    echo $dot["id"];
}

if( $_GET["action"] == "delete" )
{
    $id = $_POST["id"];
    $mysql = mysqli_connect('localhost', 'root', '', 'planet') or die('Database connection error');
    $sql = "DELETE FROM geos WHERE id = $id";
    $result = mysqli_query($mysql, $sql);
    echo "Deleted dot with id = $id!";
}

if( $_GET["action"] == "update" )
{
    $id = $_POST["id"];
    $asimuth = $_POST["asimuth"];
    $polar = $_POST["polar"];
    $mysql = mysqli_connect('localhost', 'root', '', 'planet') or die('Database connection error');
    $sql = "UPDATE geos SET asimuth = $asimuth, polar = $polar WHERE id = $id";
    $result = mysqli_query($mysql, $sql);
    echo "Updated dot with id = $id!";
}
