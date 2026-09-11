/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Container } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'

import { HeroAgents } from '../hero-agents'
import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const docsUrl = (status?.docs_link as string | undefined) || ''

  const stageRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  // Progress 0 → 1 spans exactly the pinned travel, because the stage height is
  // `100svh + travel` (see `.hero-scroll-stage` in styles/index.css).
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })

  const backdropScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  const backdropOpacity = useTransform(scrollYProgress, [0, 0.55, 1], [1, 1, 0])
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.94])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -64])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [1, 1, 0])
  const contentBlur = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    ['blur(0px)', 'blur(0px)', 'blur(8px)']
  )
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -28])

  const backdropStyle = reduceMotion
    ? undefined
    : { scale: backdropScale, opacity: backdropOpacity }
  const contentStyle = reduceMotion
    ? undefined
    : {
        scale: contentScale,
        y: contentY,
        opacity: contentOpacity,
        filter: contentBlur,
      }
  const titleStyle = reduceMotion ? undefined : { y: titleY }

  const renderDocsButton = () => {
    if (!docsUrl) return null
    const isExternal = docsUrl.startsWith('http')
    if (isExternal) {
      return (
        <Button
          variant='outline'
          size='xl'
          className='group border-border/50 hover:border-border hover:bg-muted/50'
          render={
            <a href={docsUrl} target='_blank' rel='noopener noreferrer' />
          }
        >
          <BookOpen className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200' />
          <span>{t('Docs')}</span>
        </Button>
      )
    }
    return (
      <Button
        variant='outline'
        size='xl'
        className='group border-border/50 hover:border-border hover:bg-muted/50'
        render={<Link to={docsUrl} />}
      >
        <BookOpen className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200' />
        <span>{t('Docs')}</span>
      </Button>
    )
  }

  return (
    /*
     * The first screen is a deep-space backdrop, so it must render with the dark
     * palette no matter which theme the visitor picked — otherwise the outline
     * CTAs (transparent fill, theme-coloured label) disappear into the light
     * theme's near-black text on a black photo.
     *
     * `dark` scopes the dark token set to this section and therefore also drives
     * the `dark:` variants inside it; `bg-black` is the fallback that keeps the
     * section opaque while the photo decodes (and if it ever fails to load),
     * instead of showing `PublicLayout`'s near-white page background. The
     * `data-hero-stage` hook lets the floating header keep its dark styling for
     * as long as this stage still sits behind it.
     */
    <section
      ref={stageRef}
      data-hero-stage
      className='dark hero-scroll-stage relative z-10 bg-black'
    >
      {/* Pinned screen: stays put for the whole travel distance. */}
      <div className='sticky top-0 h-svh overflow-hidden'>
        <motion.div
          aria-hidden
          className='pointer-events-none absolute inset-0'
          style={backdropStyle}
        >
          <img
            src='/home/hero-bg.png'
            alt=''
            draggable={false}
            fetchPriority='high'
            className='size-full object-cover object-center select-none'
          />
        </motion.div>

        {/* Grid pattern, carried over from the previous hero for texture. */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_40%_40%,black_20%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.06]'
        />

        {/* Left scrim keeps the copy legible over the bright halo. */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent'
        />
        {/* Bottom scrim dissolves the screen instead of cutting it off. */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black/70'
        />

        <motion.div
          className='relative flex h-full items-center'
          style={contentStyle}
        >
          <Container className='grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8'>
            {/* Left Column: Title, description, action buttons and application support */}
            <div className='flex flex-col items-start text-left lg:col-span-6'>
              {/* Top Pill Badge */}
              <div
                className='landing-animate-fade-up mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[11px] font-medium text-blue-600 opacity-0 shadow-xs dark:border-blue-400/20 dark:bg-blue-400/5 dark:text-blue-400'
                style={{ animationDelay: '0ms' }}
              >
                <span className='relative flex size-1.5'>
                  <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75' />
                  <span className='relative inline-flex size-1.5 rounded-full bg-blue-500 dark:bg-blue-400' />
                </span>
                <span>{t('Token Factory Era Has Arrived')}</span>
              </div>

              <motion.div style={titleStyle}>
                <h1
                  className='landing-animate-fade-up text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.15] font-bold tracking-tight'
                  style={{ animationDelay: '60ms' }}
                >
                  {t('One API Gateway')}
                  <br />
                  <span className='bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent'>
                    {t('Every Model at Your Fingertips')}
                  </span>
                </h1>
              </motion.div>

              <div
                className='landing-animate-fade-up mt-8 flex flex-wrap items-center gap-3 opacity-0'
                style={{ animationDelay: '180ms' }}
              >
                {props.isAuthenticated ? (
                  <>
                    <Button
                      size='xl'
                      className='group'
                      render={<Link to='/dashboard' />}
                    >
                      {t('Go to Dashboard')}
                      <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                    </Button>
                    {renderDocsButton()}
                  </>
                ) : (
                  <>
                    <Button
                      size='xl'
                      className='group'
                      render={<Link to='/sign-up' />}
                    >
                      {t('Get Started')}
                      <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                    </Button>
                    <Button
                      variant='outline'
                      size='xl'
                      className='border-border/50 hover:border-border hover:bg-muted/50'
                      render={<Link to='/pricing' />}
                    >
                      {t('View Pricing')}
                    </Button>
                    {renderDocsButton()}
                  </>
                )}
              </div>

              {/* AI Agents (只放 6 个精选，其余在「查看更多」弹窗里) */}
              <HeroAgents />
            </div>

            {/* Right Column: Hero Terminal API Demo */}
            <div
              className='landing-animate-fade-up flex w-full justify-center opacity-0 lg:col-span-6'
              style={{ animationDelay: '320ms' }}
            >
              <HeroTerminalDemo className='mt-8 lg:mt-0' />
            </div>
          </Container>
        </motion.div>
      </div>
    </section>
  )
}
