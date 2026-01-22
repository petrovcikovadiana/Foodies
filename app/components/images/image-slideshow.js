"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import burgerImg from "@/assets/burger.webp";
import tikkaImg from "@/assets/tikka.webp";
import butterImg from "@/assets/butter.webp";
import bumbonambo from "@/assets/bumbonambo.webp";
import pizzaImg from "@/assets/pizza.webp";
import noodles from "@/assets/noodles.webp";
import flank from "@/assets/flank.webp";
import chicken from "@/assets/chicken.webp";
import spagetti from "@/assets/spagetti.webp";
import chilli from "@/assets/chilli.webp";
import classes from "./image-slideshow.module.css";

const images = [
  { image: burgerImg, alt: "A delicious, juicy burger" },
  { image: tikkaImg, alt: "A delicious, spicy tikka masala" },
  { image: butterImg, alt: "Steamed butter chicken" },
  { image: bumbonambo, alt: "Bumbonambo" },
  { image: pizzaImg, alt: "A delicious pizza" },
  { image: noodles, alt: "A delicious noodles" },
  { image: flank, alt: "A delicious flank" },
  { image: chicken, alt: "A delicious chicken" },
  { image: spagetti, alt: "A delicious spagetti" },
  { image: chilli, alt: "A delicious chilli" },
];

export default function ImageSlideshow() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex < images.length - 1 ? prevIndex + 1 : 0
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={classes.slideshow}>
      {images.map((image, index) => (
        <Image
          key={index}
          src={image.image}
          className={index === currentImageIndex ? classes.active : ""}
          alt={image.alt}
        />
      ))}
    </div>
  );
}
