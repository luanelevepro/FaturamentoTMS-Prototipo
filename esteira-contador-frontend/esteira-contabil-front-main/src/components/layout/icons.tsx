type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
	logo: (props: IconProps) => (
		<svg {...props} width='150' height='150' viewBox='0 0 150 150' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				d='M45.2096 21C69.2383 22.8234 84.9739 42.808 80.5439 66.1812C90.1374 51.3098 99.6358 36.3751 109.039 21.3765C141.022 22.7223 152.756 55.2691 137.535 79.7355C126.865 96.4909 116.099 113.183 105.24 129.811C81.5968 129.64 64.5144 107.959 69.9056 85.0066C60.3122 99.878 50.8137 114.813 41.4102 129.811C15.242 128.883 -3.71799 101.008 9.11544 77.4765C18.5369 60.201 30.5818 42.9 45.2096 21Z'
				fill='currentColor'
			/>
		</svg>
	),
	logoText: (props: IconProps) => (
		<svg {...props} width='412' height='100' viewBox='0 0 412 100' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path
				d='M39.28 29.88C47.8987 29.88 54.8107 32.3973 60.016 37.432C65.2213 42.4667 67.824 49.9333 67.824 59.832V99H51.824V61.88C51.824 55.9067 50.416 51.4267 47.6 48.44C44.784 45.368 40.7733 43.832 35.568 43.832C29.68 43.832 25.0293 45.624 21.616 49.208C18.2027 52.7067 16.496 57.784 16.496 64.44V99H0.496V30.648H15.728V39.48C18.3733 36.3227 21.7013 33.9333 25.712 32.312C29.7227 30.6907 34.2453 29.88 39.28 29.88ZM119.466 99.896C112.554 99.896 106.325 98.4027 100.778 95.416C95.2313 92.4293 90.8793 88.2907 87.722 83C84.65 77.624 83.114 71.5653 83.114 64.824C83.114 58.0827 84.65 52.0667 87.722 46.776C90.8793 41.4853 95.2313 37.3467 100.778 34.36C106.325 31.3733 112.554 29.88 119.466 29.88C126.463 29.88 132.735 31.3733 138.282 34.36C143.829 37.3467 148.138 41.4853 151.21 46.776C154.367 52.0667 155.946 58.0827 155.946 64.824C155.946 71.5653 154.367 77.624 151.21 83C148.138 88.2907 143.829 92.4293 138.282 95.416C132.735 98.4027 126.463 99.896 119.466 99.896ZM119.466 86.2C125.354 86.2 130.218 84.2373 134.058 80.312C137.898 76.3867 139.818 71.224 139.818 64.824C139.818 58.424 137.898 53.2613 134.058 49.336C130.218 45.4107 125.354 43.448 119.466 43.448C113.578 43.448 108.714 45.4107 104.874 49.336C101.119 53.2613 99.242 58.424 99.242 64.824C99.242 71.224 101.119 76.3867 104.874 80.312C108.714 84.2373 113.578 86.2 119.466 86.2ZM209.646 95.288C207.769 96.824 205.465 97.976 202.734 98.744C200.089 99.512 197.273 99.896 194.286 99.896C186.777 99.896 180.974 97.9333 176.878 94.008C172.782 90.0827 170.734 84.3653 170.734 76.856V15.544H186.734V31.16H205.038V43.96H186.734V76.472C186.734 79.8 187.545 82.36 189.166 84.152C190.873 85.8587 193.219 86.712 196.206 86.712C199.79 86.712 202.777 85.7733 205.166 83.896L209.646 95.288ZM261.655 29.88C270.274 29.88 277.186 32.3973 282.391 37.432C287.596 42.4667 290.199 49.9333 290.199 59.832V99H274.199V61.88C274.199 55.9067 272.791 51.4267 269.975 48.44C267.159 45.368 263.148 43.832 257.943 43.832C252.055 43.832 247.404 45.624 243.991 49.208C240.578 52.7067 238.871 57.784 238.871 64.44V99H222.871V4.02399H238.871V38.584C241.516 35.768 244.759 33.6347 248.599 32.184C252.524 30.648 256.876 29.88 261.655 29.88ZM310.496 30.648H326.496V99H310.496V30.648ZM318.56 19.384C315.659 19.384 313.227 18.488 311.264 16.696C309.301 14.8187 308.32 12.5147 308.32 9.784C308.32 7.05333 309.301 4.79199 311.264 2.99999C313.227 1.12266 315.659 0.183998 318.56 0.183998C321.461 0.183998 323.893 1.08 325.856 2.87199C327.819 4.57866 328.8 6.75466 328.8 9.39999C328.8 12.216 327.819 14.6053 325.856 16.568C323.979 18.4453 321.547 19.384 318.56 19.384ZM380.008 86.328C387.432 86.328 393.619 83.8533 398.568 78.904L407.016 88.76C404.029 92.4293 400.189 95.2027 395.496 97.08C390.803 98.9573 385.512 99.896 379.624 99.896C372.115 99.896 365.501 98.4027 359.784 95.416C354.067 92.4293 349.629 88.2907 346.472 83C343.4 77.624 341.864 71.5653 341.864 64.824C341.864 58.168 343.357 52.1947 346.344 46.904C349.416 41.528 353.597 37.3467 358.888 34.36C364.264 31.3733 370.323 29.88 377.064 29.88C383.464 29.88 389.267 31.288 394.472 34.104C399.763 36.8347 403.944 40.8027 407.016 46.008C410.088 51.128 411.624 57.144 411.624 64.056L359.272 74.296C360.893 78.2213 363.496 81.208 367.08 83.256C370.664 85.304 374.973 86.328 380.008 86.328ZM377.064 42.68C371.176 42.68 366.397 44.6 362.728 48.44C359.144 52.28 357.352 57.4427 357.352 63.928V64.056L396.008 56.632C394.899 52.4507 392.637 49.08 389.224 46.52C385.896 43.96 381.843 42.68 377.064 42.68Z'
				fill='currentColor'
			/>
		</svg>
	),
	empty_state: (props: IconProps) => (
		<svg {...props} width='178' height='90' viewBox='0 0 178 90' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<rect x='27' y='50.5' width='124' height='39' rx='7.5' fill='currentColor' className='fill-background'></rect>
			<rect x='27' y='50.5' width='124' height='39' rx='7.5' stroke='currentColor' className='stroke-muted'></rect>
			<rect x='34.5' y='58' width='24' height='24' rx='4' fill='currentColor' className='fill-muted'></rect>
			<rect x='66.5' y='61' width='60' height='6' rx='3' fill='currentColor' className='fill-muted'></rect>
			<rect x='66.5' y='73' width='77' height='6' rx='3' fill='currentColor' className='fill-muted'></rect>
			<rect x='19.5' y='28.5' width='139' height='39' rx='7.5' fill='currentColor' className='fill-background'></rect>
			<rect x='19.5' y='28.5' width='139' height='39' rx='7.5' stroke='currentColor' className='stroke-muted'></rect>
			<rect x='27' y='36' width='24' height='24' rx='4' fill='currentColor' className='fill-muted'></rect>
			<rect x='59' y='39' width='60' height='6' rx='3' fill='currentColor' className='fill-muted'></rect>
			<rect x='59' y='51' width='92' height='6' rx='3' fill='currentColor' className='fill-muted'></rect>
			<rect x='12' y='6' width='154' height='40' rx='8' fill='currentColor' className='fill-background'></rect>
			<rect x='12.5' y='6.5' width='153' height='39' rx='7.5' stroke='currentColor' className='stroke-muted'></rect>
			<rect x='20' y='14' width='24' height='24' rx='4' fill='currentColor' className='fill-muted'></rect>
			<rect x='52' y='17' width='60' height='6' rx='3' fill='currentColor' className='fill-muted'></rect>
			<rect x='52' y='29' width='106' height='6' rx='3' fill='currentColor' className='fill-muted'></rect>
		</svg>
	),
	spinner: (props: IconProps) => (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			width='24'
			height='24'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			{...props}
		>
			<path d='M21 12a9 9 0 1 1-6.219-8.56' />
		</svg>
	),
	dolarSquare: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M8.672 14.33c0 1.29.99 2.33 2.22 2.33h2.51c1.07 0 1.94-.91 1.94-2.03 0-1.22-.53-1.65-1.32-1.93l-4.03-1.4c-.79-.28-1.32-.71-1.32-1.93 0-1.12.87-2.03 1.94-2.03h2.51c1.23 0 2.22 1.04 2.22 2.33M12 6v12'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
			<path
				d='M15 22H9c-5 0-7-2-7-7V9c0-5 2-7 7-7h6c5 0 7 2 7 7v6c0 5-2 7-7 7Z'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
		</svg>
	),
	calendar: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5Z'
				stroke='currentColor'
				strokeWidth='1.5'
				stroke-miterlimit='10'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
			<path
				d='M11.995 13.7h.01M8.294 13.7h.01M8.294 16.7h.01'
				stroke='currentColor'
				strokeWidth='2'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
		</svg>
	),
	trendDown: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='m16.5 14.5-4.2-4.2-1.6 2.4-3.2-3.2'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
			<path d='M14.5 14.5h2v-2' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'></path>
			<path
				d='M9 22h6c5 0 7-2 7-7V9c0-5-2-7-7-7H9C4 2 2 4 2 9v6c0 5 2 7 7 7Z'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
		</svg>
	),
	tickSquare: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M9 22h6c5 0 7-2 7-7V9c0-5-2-7-7-7H9C4 2 2 4 2 9v6c0 5 2 7 7 7Z'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
			<path d='m7.75 12 2.83 2.83 5.67-5.66' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'></path>
		</svg>
	),
	refreshSquare: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path
				stroke='currentColor'
				strokeLinecap='round'
				strokeLinejoin='round'
				strokeWidth='1.5'
				d='M14.55 21.67C18.84 20.54 22 16.64 22 12c0-5.52-4.44-10-10-10C5.33 2 2 7.56 2 7.56m0 0V3m0 4.56H6.44'
			></path>
			<path
				stroke='currentColor'
				stroke-dasharray='3 3'
				strokeLinecap='round'
				strokeLinejoin='round'
				strokeWidth='1.5'
				d='M2 12c0 5.52 4.48 10 10 10'
			></path>
		</svg>
	),
	profileUser: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M9.16 10.87c-.1-.01-.22-.01-.33 0a4.42 4.42 0 0 1-4.27-4.43C4.56 3.99 6.54 2 9 2a4.435 4.435 0 0 1 .16 8.87ZM16.41 4c1.94 0 3.5 1.57 3.5 3.5 0 1.89-1.5 3.43-3.37 3.5a1.13 1.13 0 0 0-.26 0M4.16 14.56c-2.42 1.62-2.42 4.26 0 5.87 2.75 1.84 7.26 1.84 10.01 0 2.42-1.62 2.42-4.26 0-5.87-2.74-1.83-7.25-1.83-10.01 0ZM18.34 20c.72-.15 1.4-.44 1.96-.87 1.56-1.17 1.56-3.1 0-4.27-.55-.42-1.22-.7-1.93-.86'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
		</svg>
	),
	info: (props: IconProps) => (
		<svg
			stroke='currentColor'
			fill='currentColor'
			strokeWidth='0'
			viewBox='0 0 512 512'
			height='200px'
			width='200px'
			xmlns='http://www.w3.org/2000/svg'
			{...props}
		>
			<path
				fill='none'
				strokeLinecap='round'
				strokeLinejoin='round'
				strokeWidth='32'
				d='M256 80c-8.66 0-16.58 7.36-16 16l8 216a8 8 0 0 0 8 8h0a8 8 0 0 0 8-8l8-216c.58-8.64-7.34-16-16-16z'
			></path>
			<circle cx='256' cy='416' r='16' fill='none' strokeLinecap='round' strokeLinejoin='round' strokeWidth='32'></circle>
		</svg>
	),
	TruckFast: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M12 14h1c1.1 0 2-.9 2-2V2H6c-1.5 0-2.81.83-3.49 2.05'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
			<path
				d='M2 17c0 1.66 1.34 3 3 3h1c0-1.1.9-2 2-2s2 .9 2 2h4c0-1.1.9-2 2-2s2 .9 2 2h1c1.66 0 3-1.34 3-3v-3h-3c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h1.29l-1.71-2.99A2.016 2.016 0 0 0 16.84 5H15v7c0 1.1-.9 2-2 2h-1'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
			<path
				d='M8 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM22 12v2h-3c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h1.29L22 12ZM2 8h6M2 11h4M2 14h2'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
		</svg>
	),
	Receipt1: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M6.73 19.7c.82-.88 2.07-.81 2.79.15l1.01 1.35c.81 1.07 2.12 1.07 2.93 0l1.01-1.35c.72-.96 1.97-1.03 2.79-.15 1.78 1.9 3.23 1.27 3.23-1.39V7.04C20.5 3.01 19.56 2 15.78 2H8.22C4.44 2 3.5 3.01 3.5 7.04V18.3c0 2.67 1.46 3.29 3.23 1.4ZM8 7h8M9 11h6'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
		</svg>
	),
	ReceiptText: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path
				d='M22 6v2.42C22 10 21 11 19.42 11H16V4.01C16 2.9 16.91 2 18.02 2c1.09.01 2.09.45 2.81 1.17C21.55 3.9 22 4.9 22 6Z'
				stroke='currentColor'
				strokeWidth='1.5'
				stroke-miterlimit='10'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
			<path
				d='M2 7v14c0 .83.94 1.3 1.6.8l1.71-1.28c.4-.3.96-.26 1.32.1l1.66 1.67c.39.39 1.03.39 1.42 0l1.68-1.68c.35-.35.91-.39 1.3-.09l1.71 1.28c.66.49 1.6.02 1.6-.8V4c0-1.1.9-2 2-2H6C3 2 2 3.79 2 6v1Z'
				stroke='currentColor'
				strokeWidth='1.5'
				stroke-miterlimit='10'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
			<path d='M6 9h6M6.75 13h4.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
		</svg>
	),
	DocumentDownload: (props: IconProps) => (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' {...props}>
			<path d='M9 11v6l2-2M9 17l-2-2' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'></path>
			<path
				d='M22 10v5c0 5-2 7-7 7H9c-5 0-7-2-7-7V9c0-5 2-7 7-7h5'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
			<path
				d='M22 10h-4c-3 0-4-1-4-4V2l8 8Z'
				stroke='currentColor'
				strokeWidth='1.5'
				strokeLinecap='round'
				strokeLinejoin='round'
			></path>
		</svg>
	),
};
